import { Injectable, NotFoundException } from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyLaborersService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

  // ─── Registry ──────────────────────────────────────────────

  async create(
    companyId: number,
    dto: {
      laborerCode: string;
      firstName: string;
      lastName: string;
      phone?: string;
      dailyRate: number;
    },
  ) {
    const rows: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `INSERT INTO finsync.daily_laborers
         ("companyId", "laborerCode", "firstName", "lastName", phone, "dailyRate", "isActive", "joinedDate", "created_at", "updated_at")
       VALUES (${companyId}, '${dto.laborerCode.replace(/'/g, "''")}',
         '${dto.firstName.replace(/'/g, "''")}',
         '${dto.lastName.replace(/'/g, "''")}',
         ${dto.phone ? `'${dto.phone.replace(/'/g, "''")}'` : 'NULL'},
         ${dto.dailyRate}, true, NOW(), NOW(), NOW())
       RETURNING id`,
    );
    return this.findOne(companyId, rows[0].id);
  }

  async findAll(companyId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT dl.*,
         COUNT(dlt.id) AS "timesheetCount",
         COALESCE(SUM(CASE WHEN dlt."breakDay" = false AND dlt.status = 'APPROVED' THEN dlt.hours END), 0) AS "totalHours"
       FROM finsync.daily_laborers dl
       LEFT JOIN finsync.daily_laborer_timesheets dlt ON dlt."laborerId" = dl.id
       WHERE dl."companyId" = ${companyId}
       GROUP BY dl.id
       ORDER BY dl."lastName", dl."firstName"`,
    );
  }

  async findOne(companyId: number, id: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.daily_laborers WHERE id = ${id} AND "companyId" = ${companyId}`,
    );
    if (!rows.length) throw new NotFoundException('Daily laborer not found');
    return rows[0];
  }

  async update(
    companyId: number,
    id: number,
    dto: {
      laborerCode?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      dailyRate?: number;
      isActive?: boolean;
    },
  ) {
    const sets: string[] = ['"updated_at" = NOW()'];
    if (dto.laborerCode)
      sets.push(`"laborerCode" = '${dto.laborerCode.replace(/'/g, "''")}'`);
    if (dto.firstName)
      sets.push(`"firstName" = '${dto.firstName.replace(/'/g, "''")}'`);
    if (dto.lastName)
      sets.push(`"lastName" = '${dto.lastName.replace(/'/g, "''")}'`);
    if (dto.phone !== undefined)
      sets.push(
        `phone = ${dto.phone ? `'${dto.phone.replace(/'/g, "''")}'` : 'NULL'}`,
      );
    if (dto.dailyRate !== undefined)
      sets.push(`"dailyRate" = ${dto.dailyRate}`);
    if (dto.isActive !== undefined) sets.push(`"isActive" = ${dto.isActive}`);

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.daily_laborers SET ${sets.join(', ')} WHERE id = ${id} AND "companyId" = ${companyId}`,
    );
    return this.findOne(companyId, id);
  }

  async remove(companyId: number, id: number) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.daily_laborers WHERE id = ${id} AND "companyId" = ${companyId}`,
    );
    return { id, deleted: true };
  }

  // ─── Exclusive Timesheet / Attendance ──────────────────────

  async createTimesheet(
    companyId: number,
    dto: {
      laborerId: number;
      date: string;
      hours?: number;
      breakDay?: boolean;
      note?: string;
    },
  ) {
    const laborer: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync.daily_laborers WHERE id = ${dto.laborerId} AND "companyId" = ${companyId}`,
    );
    if (!laborer.length) throw new NotFoundException('Daily laborer not found');

    await this.prisma.$queryRawUnsafe(
      `INSERT INTO finsync.daily_laborer_timesheets
         ("companyId", "laborerId", date, hours, "breakDay", note, status, "created_at")
       VALUES (${companyId}, ${dto.laborerId}, '${dto.date}',
         ${dto.breakDay ? 0 : (dto.hours ?? 8)}, ${dto.breakDay ?? false},
         ${dto.note ? `'${dto.note.replace(/'/g, "''")}'` : 'NULL'},
         'APPROVED', NOW())`,
    );
    return this.getTimesheetsByLaborer(companyId, dto.laborerId);
  }

  async getTimesheetsByLaborer(companyId: number, laborerId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT dlt.* FROM finsync.daily_laborer_timesheets dlt
       WHERE dlt."companyId" = ${companyId} AND dlt."laborerId" = ${laborerId}
       ORDER BY dlt.date DESC`,
    );
  }

  async listTimesheets(
    companyId: number,
    startDate?: string,
    endDate?: string,
  ) {
    const sd = startDate ? `AND dlt.date >= '${startDate}'` : '';
    const ed = endDate ? `AND dlt.date <= '${endDate}'` : '';
    return this.prisma.$queryRawUnsafe(
      `SELECT dlt.*, json_build_object('id', dl.id, 'firstName', dl."firstName", 'lastName', dl."lastName", 'laborerCode', dl."laborerCode", 'dailyRate', dl."dailyRate") AS laborer
       FROM finsync.daily_laborer_timesheets dlt
       JOIN finsync.daily_laborers dl ON dl.id = dlt."laborerId"
       WHERE dlt."companyId" = ${companyId} ${sd} ${ed}
       ORDER BY dlt.date DESC, dl."lastName"`,
    );
  }

  // ─── Period Payroll Run (daily rate × worked days, break days not payable) ──

  async generatePeriodPayroll(
    companyId: number,
    startDate: string,
    endDate: string,
  ) {
    const laborerRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT dl.id, dl."firstName", dl."lastName", dl."dailyRate",
              COALESCE(SUM(CASE WHEN dlt."breakDay" = false AND dlt.status = 'APPROVED' THEN 1 ELSE 0 END), 0) AS workedDays,
              COALESCE(SUM(CASE WHEN dlt."breakDay" = false AND dlt.status = 'APPROVED' THEN dlt.hours ELSE 0 END), 0) AS totalHours
       FROM finsync.daily_laborers dl
       LEFT JOIN finsync.daily_laborer_timesheets dlt
         ON dlt."laborerId" = dl.id
        AND dlt."companyId" = ${companyId}
        AND DATE(dlt.date) >= DATE('${startDate}')
        AND DATE(dlt.date) <= DATE('${endDate}')
       WHERE dl."companyId" = ${companyId} AND dl."isActive" = true
       GROUP BY dl.id
       ORDER BY dl."lastName", dl."firstName"`,
    );

    const payrollRows: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `INSERT INTO finsync.payrolls ("companyId", title, "sourceType", "startDate", "endDate", "totalAmount", status, "created_at", "updated_at")
       VALUES (${companyId}, 'Daily Laborers ${startDate} → ${endDate}', 'DAILY_LABORERS',
         '${startDate}', '${endDate}', 0, 'DRAFT', NOW(), NOW())
       RETURNING id`,
    );
    const payrollId = payrollRows[0].id;

    let total = 0;
    let items = 0;
    for (const laborer of laborerRows) {
      const workedDays = parseInt(laborer.workedDays || '0', 10);
      if (workedDays <= 0) continue;
      const dailyRate = parseFloat(String(laborer.dailyRate || 0));
      const basePay = Math.round(dailyRate * workedDays * 100) / 100;

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO finsync.payroll_items
           ("payrollId", "employeeId", "basePay", "overtimeEarnings", "overtimePay",
            "allowanceTotal", "bonusTotal", "grossPay", "totalDeductions", "withholdingTotal",
            "netPay", "unpaidLeaveDays", "unpaidLeaveDeduction", "taxAmount")
         VALUES (${payrollId}, ${laborer.id}, ${basePay}, 0, 0, 0, 0, ${basePay}, 0, 0,
           ${basePay}, 0, 0, 0)`,
      );
      total += basePay;
      items++;
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.payrolls SET "totalAmount" = ${total} WHERE id = ${payrollId}`,
    );

    return { payrollId, items, totalAmount: total, laborers: laborerRows };
  }
}
