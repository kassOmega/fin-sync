import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async getByDate(companyId: number, date: string, projectId?: number) {
    const pf = projectId ? `AND a."projectId" = ${projectId}` : '';
    return this.prisma.$queryRawUnsafe(
      `SELECT a.*, json_build_object('id', e.id, 'firstName', e."firstName", 'lastName', e."lastName", 'employeeCode', e."employeeCode") AS employee
       FROM finsync.attendances a
       JOIN finsync.employees e ON e.id = a."employeeId"
       WHERE a."companyId" = ${companyId} AND a.date = '${date}' ${pf}
       ORDER BY e."firstName"`,
    );
  }

  async mark(companyId: number, employeeId: number, dto: any) {
    const status = dto.status || 'PRESENT';
    const checkIn = dto.checkIn ? `'${dto.checkIn}'` : 'NULL';
    const checkOut = dto.checkOut ? `'${dto.checkOut}'` : 'NULL';
    const remarks = dto.remarks ? `'${dto.remarks}'` : 'NULL';
    const projectId = dto.projectId ?? 'NULL';

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync.attendances ("companyId", "employeeId", "projectId", date, "checkIn", "checkOut", status, remarks, "created_at")
       VALUES (${companyId}, ${employeeId}, ${projectId}, '${dto.date}', ${checkIn}, ${checkOut}, '${status}', ${remarks}, NOW())
       ON CONFLICT ("employeeId", date) DO UPDATE SET
         status = '${status}',
         "checkIn" = COALESCE(${checkIn}, attendances."checkIn"),
         "checkOut" = COALESCE(${checkOut}, attendances."checkOut"),
         remarks = COALESCE(${remarks}, attendances.remarks),
         "projectId" = COALESCE(${projectId}, attendances."projectId")`,
    );

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.attendances WHERE "employeeId" = ${employeeId} AND date = '${dto.date}'`,
    );
    return rows[0];
  }

  async getEmployeeRecords(companyId: number, employeeId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.attendances
       WHERE "companyId" = ${companyId} AND "employeeId" = ${employeeId}
       ORDER BY date DESC LIMIT 90`,
    );
  }
}
