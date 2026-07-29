import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: number, projectId?: number) {
    const pf = projectId ? `AND p."projectId" = ${projectId}` : '';
    return this.prisma.$queryRawUnsafe(
      `SELECT p.* FROM finsync.payrolls p
       WHERE p."companyId" = ${companyId} ${pf}
       ORDER BY p."created_at" DESC`,
    );
  }

  async generate(companyId: number, dto: any) {
    const pid = dto.projectId ?? 'NULL';

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync.payrolls ("companyId", "projectId", title, "startDate", "endDate", status, "created_at", "updated_at")
       VALUES (${companyId}, ${pid}, '${dto.title}', '${dto.startDate}', '${dto.endDate}', 'DRAFT', NOW(), NOW())`,
    );

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.payrolls ORDER BY id DESC LIMIT 1`,
    );
    const payroll = rows[0];

    // Auto-calculate from approved timesheets
    const pf = dto.projectId ? `AND t."projectId" = ${dto.projectId}` : '';
    const timesheets: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT t."employeeId", SUM(t."regularHours") as total_regular, SUM(t."overtimeHours") as total_overtime
       FROM finsync.timesheets t
       WHERE t."companyId" = ${companyId} AND t.status = 'APPROVED'
         AND t.date >= '${dto.startDate}' AND t.date <= '${dto.endDate}' ${pf}
       GROUP BY t."employeeId"`,
    );

    let totalAmount = 0;

    for (const ts of timesheets) {
      const emp: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM finsync.employees WHERE id = ${ts.employeeId}`,
      );
      if (!emp.length) continue;
      const e = emp[0];

      const reg = parseFloat(String(ts.total_regular || 0));
      const ot = parseFloat(String(ts.total_overtime || 0));
      const rate = parseFloat(String(e.hourlyRate || 0));
      const basePay = reg * rate;
      const overtimePay = ot * rate * 1.5;
      const netPay = basePay + overtimePay;

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO finsync.payroll_items ("payrollId", "employeeId", "basePay", "overtimePay", deductions, "netPay")
         VALUES (${payroll.id}, ${ts.employeeId}, ${basePay}, ${overtimePay}, 0, ${netPay})`,
      );
      totalAmount += netPay;
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.payrolls SET "totalAmount" = ${totalAmount} WHERE id = ${payroll.id}`,
    );

    return { ...payroll, totalAmount, itemsGenerated: timesheets.length };
  }

  async approve(payrollId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.payrolls WHERE id = ${payrollId}`,
    );
    if (!rows.length) throw new NotFoundException('Payroll not found');
    const p = rows[0];

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.payrolls SET status = 'APPROVED', "updated_at" = NOW() WHERE id = ${payrollId}`,
    );

    // Auto-create CompanyExpense
    const amount = parseFloat(String(p.totalAmount || 0));
    if (amount > 0) {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO finsync."CompanyExpense" (company_id, registered_by, amount, category, date, note, project_id, payroll_expense_id, "createdAt", is_recurring, recurring_frequency)
         VALUES (${p.companyId}, ${p.companyId}, ${amount}, 'Payroll', NOW(), 'Payroll: ${p.title}', ${p.projectId ?? 'NULL'}, ${payrollId}, NOW(), false, NULL)`,
      );

      const expRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM finsync."CompanyExpense" WHERE payroll_expense_id = ${payrollId} ORDER BY id DESC LIMIT 1`,
      );
      if (expRows.length) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE finsync.payrolls SET "expenseId" = ${expRows[0].id} WHERE id = ${payrollId}`,
        );
      }
    }

    return { approved: true, id: payrollId, expenseCreated: amount > 0 };
  }

  async getItems(payrollId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT pi.*, json_build_object('id', e.id, 'firstName', e."firstName", 'lastName', e."lastName", 'employeeCode', e."employeeCode") AS employee
       FROM finsync.payroll_items pi
       JOIN finsync.employees e ON e.id = pi."employeeId"
       WHERE pi."payrollId" = ${payrollId}`,
    );
  }
}
