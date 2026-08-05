import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
      dailyRate?: number;
      hourlyRate?: number;
      taxMethod?: string;
      taxRate?: number;
    },
  ) {
    // Mode-based rate validation: attendance → daily rate, timesheet → hourly rate
    const compRows: { tempWorkerTimeMode: string }[] =
      await this.prisma.$queryRawUnsafe(
        `SELECT "temp_worker_time_mode" AS "tempWorkerTimeMode" FROM finsync."Company" WHERE id = ${companyId}`,
      );
    const mode = compRows[0]?.tempWorkerTimeMode || 'TIMESHEET';
    if (mode === 'ATTENDANCE' && (!dto.dailyRate || dto.dailyRate <= 0)) {
      throw new BadRequestException('Daily rate is required in attendance mode');
    }
    if (mode === 'TIMESHEET' && (!dto.hourlyRate || dto.hourlyRate <= 0)) {
      throw new BadRequestException('Hourly rate is required in timesheet mode');
    }

    const rows: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `INSERT INTO finsync.daily_laborers
         ("companyId", "laborerCode", "firstName", "lastName", phone, "dailyRate", "hourly_rate", "tax_method", "tax_rate", "isActive", "joinedDate", "created_at", "updated_at")
       VALUES (${companyId}, '${dto.laborerCode.replace(/'/g, "''")}',
         '${dto.firstName.replace(/'/g, "''")}',
         '${dto.lastName.replace(/'/g, "''")}',
         ${dto.phone ? `'${dto.phone.replace(/'/g, "''")}'` : 'NULL'},
         ${dto.dailyRate ?? 'NULL'},
         ${dto.hourlyRate !== undefined ? dto.hourlyRate : 'NULL'},
         '${dto.taxMethod || 'GLOBAL'}',
         ${dto.taxRate !== undefined ? dto.taxRate : 'NULL'},
         true, NOW(), NOW(), NOW())
       RETURNING id`,
    );
    return this.findOne(companyId, rows[0].id);
  }

  async findAll(companyId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT dl.id, dl."companyId", dl."laborerCode", dl."firstName", dl."lastName",
              dl.phone, dl."dailyRate",
              dl."hourly_rate" AS "hourlyRate",
              dl."tax_method" AS "taxMethod", dl."tax_rate" AS "taxRate",
              dl."isActive", dl."joinedDate",
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
      hourlyRate?: number;
      taxMethod?: string;
      taxRate?: number;
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
    if (dto.hourlyRate !== undefined)
      sets.push(
        `"hourly_rate" = ${dto.hourlyRate !== null ? dto.hourlyRate : 'NULL'}`,
      );
    if (dto.taxMethod !== undefined)
      sets.push(`"tax_method" = '${dto.taxMethod}'`);
    if (dto.taxRate !== undefined)
      sets.push(`"tax_rate" = ${dto.taxRate !== null ? dto.taxRate : 'NULL'}`);
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

  // ─── Attendance records (attendance-mode) ──────────────────

  async upsertAttendance(
    companyId: number,
    dto: {
      laborerId: number;
      date: string;
      status: string;
      note?: string;
    },
  ) {
    const laborer: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync.daily_laborers WHERE id = ${dto.laborerId} AND "companyId" = ${companyId}`,
    );
    if (!laborer.length) throw new NotFoundException('Temporary worker not found');

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync.daily_laborer_attendances
         ("companyId", "laborerId", date, status, note, "created_at")
       VALUES (${companyId}, ${dto.laborerId}, '${dto.date}', '${dto.status}',
         ${dto.note ? `'${dto.note.replace(/'/g, "''")}'` : 'NULL'}, NOW())
       ON CONFLICT ("laborerId", date)
       DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note`,
    );
    return this.getAttendancesByLaborer(companyId, dto.laborerId);
  }

  async listAttendances(
    companyId: number,
    startDate?: string,
    endDate?: string,
  ) {
    const sd = startDate ? `AND a.date >= '${startDate}'` : '';
    const ed = endDate ? `AND a.date <= '${endDate}'` : '';
    return this.prisma.$queryRawUnsafe(
      `SELECT a.*, json_build_object('id', dl.id, 'firstName', dl."firstName", 'lastName', dl."lastName", 'laborerCode', dl."laborerCode", 'dailyRate', dl."dailyRate", 'hourlyRate', dl."hourly_rate") AS laborer
       FROM finsync.daily_laborer_attendances a
       JOIN finsync.daily_laborers dl ON dl.id = a."laborerId"
       WHERE a."companyId" = ${companyId} ${sd} ${ed}
       ORDER BY a.date DESC, dl."lastName"`,
    );
  }

  async getAttendancesByLaborer(companyId: number, laborerId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.daily_laborer_attendances
       WHERE "companyId" = ${companyId} AND "laborerId" = ${laborerId}
       ORDER BY date DESC`,
    );
  }

  async deleteAttendance(companyId: number, id: number) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.daily_laborer_attendances WHERE id = ${id} AND "companyId" = ${companyId}`,
    );
    return { id, deleted: true };
  }

  // ─── Period Payroll Run (mode + tax aware) ─────────────────

  /** Read a raw-query row key case-insensitively. Raw queries return keys
   *  lower-cased for unquoted aliases (e.g. `AS workedDays` → `workeddays`)
   *  and camel-cased for quoted ones (`AS "workedDays"` → `workedDays`),
   *  so never rely on a single casing — a stale build must not silently
   *  skip every laborer and produce a 0-item payroll. */
  private pick(row: any, ...keys: string[]): any {
    if (!row) return undefined;
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null) return row[k];
      const lower = k.toLowerCase();
      const hit = Object.keys(row).find((rk) => rk.toLowerCase() === lower);
      if (hit !== undefined) return row[hit];
    }
    return undefined;
  }

  async generatePeriodPayroll(
    companyId: number,
    startDate: string,
    endDate: string,
  ) {
    // Reject overlapping temporary-worker payrolls for the same period
    const twOverlap: { cnt: string }[] = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) AS cnt
       FROM finsync.payrolls
       WHERE "companyId" = ${companyId}
         AND status <> 'VOIDED'
         AND "sourceType" = 'DAILY_LABORERS'
         AND "startDate" <= '${endDate}'
         AND "endDate" >= '${startDate}'`,
    );
    if (parseInt(twOverlap[0]?.cnt || '0', 10) > 0) {
      throw new BadRequestException(
        `A temporary-worker payroll already covers this date range (${startDate} → ${endDate}). Void or delete it first.`,
      );
    }

    // Company temp-worker settings (time mode + global tax defaults)
    const compRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "temp_worker_time_mode" AS "tempWorkerTimeMode",
              "temp_worker_tax_enabled" AS "tempWorkerTaxEnabled",
              "temp_worker_tax_rate" AS "tempWorkerTaxRate"
       FROM finsync."Company" WHERE id = ${companyId}`,
    );
    const timeMode = compRows[0]?.tempWorkerTimeMode || 'TIMESHEET';
    const taxEnabled = !!compRows[0]?.tempWorkerTaxEnabled;
    const globalTaxRate = parseFloat(compRows[0]?.tempWorkerTaxRate || '0');
    const isAttendance = timeMode === 'ATTENDANCE';

    // Worked days / hours per laborer in period.
    // ATTENDANCE mode weights: PRESENT=1.0, LATE=1.0, HALF_DAY=0.5, ABSENT=0.
    // TIMESHEET mode: non-break APPROVED shifts count as 1 day, hours summed.
    const workedQuery = isAttendance
      ? `COALESCE(SUM(CASE WHEN a.status = 'PRESENT' THEN 1.0
                            WHEN a.status = 'LATE' THEN 1.0
                            WHEN a.status = 'HALF_DAY' THEN 0.5
                            ELSE 0 END), 0) AS "workedDays"`
      : `COALESCE(SUM(CASE WHEN dlt."breakDay" = false AND dlt.status = 'APPROVED' THEN 1 ELSE 0 END), 0) AS "workedDays"`;
    const hoursQuery = isAttendance
      ? `COALESCE(SUM(CASE WHEN a.status = 'HALF_DAY' THEN 4 ELSE 8 END), 0) AS "totalHours"`
      : `COALESCE(SUM(CASE WHEN dlt."breakDay" = false AND dlt.status = 'APPROVED' THEN dlt.hours ELSE 0 END), 0) AS "totalHours"`;
    const joinClause = isAttendance
      ? `LEFT JOIN finsync.daily_laborer_attendances a
           ON a."laborerId" = dl.id
          AND a."companyId" = ${companyId}
          AND DATE(a.date) >= DATE('${startDate}')
          AND DATE(a.date) <= DATE('${endDate}')`
      : `LEFT JOIN finsync.daily_laborer_timesheets dlt
           ON dlt."laborerId" = dl.id
          AND dlt."companyId" = ${companyId}
          AND DATE(dlt.date) >= DATE('${startDate}')
          AND DATE(dlt.date) <= DATE('${endDate}')`;

    const laborerRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT dl.id, dl."firstName", dl."lastName", dl."dailyRate",
              dl."hourly_rate" AS "hourlyRate",
              dl."tax_method" AS "taxMethod", dl."tax_rate" AS "taxRate",
              ${workedQuery}, ${hoursQuery}
       FROM finsync.daily_laborers dl
       ${joinClause}
       WHERE dl."companyId" = ${companyId} AND dl."isActive" = true
       GROUP BY dl.id
       ORDER BY dl."lastName", dl."firstName"`,
    );

    const payrollRows: { id: number }[] = await this.prisma.$queryRawUnsafe(
      `INSERT INTO finsync.payrolls ("companyId", title, "sourceType", "startDate", "endDate", "totalAmount", status, "created_at", "updated_at")
       VALUES (${companyId}, 'Temporary Workers ${startDate} → ${endDate}', 'DAILY_LABORERS',
         '${startDate}', '${endDate}', 0, 'DRAFT', NOW(), NOW())
       RETURNING id`,
    );
    const payrollId = payrollRows[0].id;

    let total = 0;
    let totalTax = 0;
    let items = 0;
    for (const raw of laborerRows) {
      // Normalize row keys once (robust against raw-query alias casing)
      const laborer = {
        id: this.pick(raw, 'id'),
        firstName: this.pick(raw, 'firstName', 'firstname'),
        lastName: this.pick(raw, 'lastName', 'lastname'),
        dailyRate: this.pick(raw, 'dailyRate', 'dailyrate'),
        hourlyRate: this.pick(raw, 'hourlyRate', 'hourlyrate'),
        taxMethod: this.pick(raw, 'taxMethod', 'taxmethod'),
        taxRate: this.pick(raw, 'taxRate', 'taxrate'),
        workedDays: this.pick(raw, 'workedDays', 'workeddays'),
        totalHours: this.pick(raw, 'totalHours', 'totalhours'),
      };
      const workedDays = parseFloat(String(laborer.workedDays ?? 0));
      if (workedDays <= 0) continue;

      const dailyRate = parseFloat(String(laborer.dailyRate ?? 0));
      const hourlyRate = parseFloat(String(laborer.hourlyRate ?? 0));
      const totalHours = parseFloat(String(laborer.totalHours ?? 0));

      // Gross: timesheet + hourlyRate → hours × hourlyRate; otherwise days × dailyRate
      let grossPay: number;
      if (!isAttendance && hourlyRate > 0) {
        grossPay = Math.round(totalHours * hourlyRate * 100) / 100;
      } else {
        grossPay = Math.round(dailyRate * workedDays * 100) / 100;
      }

      // Tax: EXEMPT → 0; CUSTOM → worker's own rate; GLOBAL → company default rate
      const taxMethod = laborer.taxMethod || 'GLOBAL';
      let taxRate = 0;
      if (taxEnabled && taxMethod !== 'EXEMPT') {
        if (taxMethod === 'CUSTOM') {
          taxRate = parseFloat(String(laborer.taxRate ?? 0));
        } else {
          taxRate = globalTaxRate;
        }
      }
      const taxAmount = Math.round(grossPay * taxRate) / 100;
      const netPay = Math.round((grossPay - taxAmount) * 100) / 100;

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO finsync.payroll_items
           ("payrollId", "employeeId", "basePay", "overtimeEarnings", "overtimePay",
            "allowanceTotal", "bonusTotal", "grossPay", "totalDeductions", "withholdingTotal",
            "netPay", "unpaidLeaveDays", "unpaidLeaveDeduction", "taxAmount")
         VALUES (${payrollId}, ${laborer.id}, ${grossPay}, 0, 0, 0, 0, ${grossPay}, 0, 0,
           ${netPay}, 0, 0, ${taxAmount})`,
      );
      total += netPay;
      totalTax += taxAmount;
      items++;
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.payrolls SET "totalAmount" = ${total} WHERE id = ${payrollId}`,
    );

    return {
      payrollId,
      items,
      totalAmount: total,
      totalTax,
      timeMode,
      laborers: laborerRows.map((r) => ({
        id: this.pick(r, 'id'),
        firstName: this.pick(r, 'firstName', 'firstname'),
        lastName: this.pick(r, 'lastName', 'lastname'),
        dailyRate: this.pick(r, 'dailyRate', 'dailyrate'),
        hourlyRate: this.pick(r, 'hourlyRate', 'hourlyrate'),
        taxMethod: this.pick(r, 'taxMethod', 'taxmethod'),
        taxRate: this.pick(r, 'taxRate', 'taxrate'),
        workedDays: this.pick(r, 'workedDays', 'workeddays'),
        totalHours: this.pick(r, 'totalHours', 'totalhours'),
      })),
    };
  }
}
