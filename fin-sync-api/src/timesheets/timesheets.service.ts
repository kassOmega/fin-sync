import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimesheetsService {
  constructor(private prisma: PrismaService) {}

  async findByDate(companyId: number, date: string, projectId?: number) {
    const pf = projectId ? `AND t."projectId" = ${projectId}` : '';
    return this.prisma.$queryRawUnsafe(
      `SELECT t.*, json_build_object('id', e.id, 'firstName', e."firstName", 'lastName', e."lastName") AS employee
       FROM finsync.timesheets t
       JOIN finsync.employees e ON e.id = t."employeeId"
       WHERE t."companyId" = ${companyId} AND t.date = '${date}' ${pf}
       ORDER BY e."firstName"`,
    );
  }

  async create(companyId: number, dto: any) {
    const pid = dto.projectId ?? 'NULL';
    const mid = dto.machineryId ?? 'NULL';
    const desc = dto.description ? `'${dto.description}'` : 'NULL';
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync.timesheets ("companyId", "employeeId", "projectId", "machineryId", date, "regularHours", "overtimeHours", description, status, "created_at")
       VALUES (${companyId}, ${dto.employeeId}, ${pid}, ${mid}, '${dto.date}', ${dto.regularHours ?? 8.0}, ${dto.overtimeHours ?? 0.0}, ${desc}, 'DRAFT', NOW())`,
    );
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.timesheets WHERE "employeeId" = ${dto.employeeId} AND date = '${dto.date}' ORDER BY id DESC LIMIT 1`,
    );
    return rows[0];
  }

  async approve(id: number, approvedById: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.timesheets WHERE id = ${id}`,
    );
    if (!rows.length) throw new NotFoundException('Timesheet not found');

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.timesheets SET status = 'APPROVED', "approvedById" = ${approvedById}, "approvedAt" = NOW() WHERE id = ${id}`,
    );

    const ts = rows[0];

    // Auto-sync machinery
    if (ts.machineryId) {
      const hrs =
        parseFloat(String(ts.regularHours || 0)) +
        parseFloat(String(ts.overtimeHours || 0));
      if (hrs > 0) {
        const pid = ts.projectId ?? 'NULL';
        const oid = ts.employeeId ?? 'NULL';
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO finsync.machinery_logs ("machineryId", "projectId", "operatorId", "hoursLogged", date, "created_at")
           VALUES (${ts.machineryId}, ${pid}, ${oid}, ${hrs}, '${ts.date}', NOW())`,
        );
        await this.prisma.$executeRawUnsafe(
          `UPDATE finsync.machineries SET "totalHoursRun" = "totalHoursRun" + ${hrs}, "updated_at" = NOW() WHERE id = ${ts.machineryId}`,
        );
      }
    }

    return { approved: true, id };
  }

  async getPending(companyId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT t.*, json_build_object('id', e.id, 'firstName', e."firstName", 'lastName', e."lastName") AS employee
       FROM finsync.timesheets t
       JOIN finsync.employees e ON e.id = t."employeeId"
       WHERE t."companyId" = ${companyId} AND t.status = 'SUBMITTED'
       ORDER BY t.date`,
    );
  }

  async submit(id: number) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.timesheets SET status = 'SUBMITTED' WHERE id = ${id}`,
    );
    return { submitted: true, id };
  }
}
