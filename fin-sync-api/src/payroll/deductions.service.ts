import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DeductionResult {
  name: string;
  amount: number;
  type: string;
}

@Injectable()
export class DeductionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute all deductions for an employee in a payroll period.
   * Returns breakdown + totals for unpaid leave and income tax.
   */
  async computeDeductions(
    companyId: number,
    employeeId: number,
    grossPay: number,
    startDate: string,
    endDate: string,
  ): Promise<{
    deductions: DeductionResult[];
    totalDeductions: number;
    unpaidLeaveDays: number;
    unpaidLeaveDeduction: number;
    taxAmount: number;
    taxableIncome: number;
  }> {
    const results: DeductionResult[] = [];

    // 1. Calculate unpaid leave deduction
    const { unpaidLeaveDays, unpaidLeaveDeduction } =
      await this.computeUnpaidLeave(companyId, employeeId, startDate, endDate);

    // Taxable income = grossPay minus unpaid leave deduction
    const taxableIncome = grossPay - unpaidLeaveDeduction;

    let totalDeductions = 0;
    let taxAmount = 0;

    if (unpaidLeaveDeduction > 0) {
      results.push({
        name: `Unpaid Leave (${unpaidLeaveDays} days)`,
        amount: unpaidLeaveDeduction,
        type: 'LEAVE_UNPAID',
      });
      totalDeductions += unpaidLeaveDeduction;
    }

    // 2. Income tax from the VERSIONED company payroll config
    //    (Ethiopian shortcut formula: income × rate − deduct per bracket)
    const config = await this.getEffectiveConfig(companyId);
    if (config?.tax_brackets?.length) {
      taxAmount = this.computeEthiopianTax(
        taxableIncome,
        JSON.parse(config.tax_brackets),
      );
      if (taxAmount > 0) {
        results.push({ name: 'Income Tax', amount: taxAmount, type: 'TAX' });
        totalDeductions += taxAmount;
      }
    }

    // 3. Employee pension (statutory % of gross, config-driven)
    const pensionRate = parseFloat(String(config?.employee_pension_rate ?? 7));
    const pensionAmount =
      Math.round(grossPay * (pensionRate / 100) * 100) / 100;
    if (pensionAmount > 0) {
      results.push({
        name: 'Employee Pension',
        amount: pensionAmount,
        type: 'PENSION',
      });
      totalDeductions += pensionAmount;
    }

    // 4. Additional FIXED/PERCENTAGE deduction rules (BRACKET handled above)
    const deductionRules = await (this.prisma as any).payrollDeduction.findMany(
      {
        where: { companyId, isActive: true, type: { not: 'BRACKET' } },
      },
    );

    for (const rule of deductionRules) {
      let amount = 0;

      switch (rule.type) {
        case 'FIXED':
          amount = Number(rule.value);
          break;

        case 'PERCENTAGE':
          amount = taxableIncome * (Number(rule.value) / 100);
          break;

        case 'LEAVE_UNPAID':
          // Already calculated above
          amount = 0;
          break;
      }

      if (amount > 0) {
        results.push({ name: rule.name, amount, type: rule.type });
        totalDeductions += amount;
      }
    }

    // Ensure net pay is never negative
    if (totalDeductions > grossPay) {
      totalDeductions = grossPay;
    }

    return {
      deductions: results,
      totalDeductions,
      unpaidLeaveDays,
      unpaidLeaveDeduction,
      taxAmount,
      taxableIncome,
    };
  }

  /**
   * Fetch approved unpaid leave days within the payroll period.
   */
  private async computeUnpaidLeave(
    companyId: number,
    employeeId: number,
    payrollStart: string,
    payrollEnd: string,
  ): Promise<{ unpaidLeaveDays: number; unpaidLeaveDeduction: number }> {
    const leaveRequests: any[] = await (
      this.prisma as any
    ).leaveRequest.findMany({
      where: {
        employeeId,
        companyId,
        status: 'APPROVED',
        startDate: { lte: new Date(payrollEnd) },
        endDate: { gte: new Date(payrollStart) },
        leaveType: { isPaid: false },
      },
      include: {
        leaveType: true,
      },
    });

    let unpaidLeaveDays = 0;
    for (const req of leaveRequests) {
      // Count only the days that fall within the payroll period
      const leaveStart = new Date(req.startDate);
      const leaveEnd = new Date(req.endDate);
      const periodStart = new Date(payrollStart);
      const periodEnd = new Date(payrollEnd);

      const overlapStart = leaveStart > periodStart ? leaveStart : periodStart;
      const overlapEnd = leaveEnd < periodEnd ? leaveEnd : periodEnd;

      if (overlapStart <= overlapEnd) {
        // Count business days in overlap
        let count = 0;
        const current = new Date(overlapStart);
        while (current <= overlapEnd) {
          const day = current.getDay();
          if (day !== 0 && day !== 6) count++;
          current.setDate(current.getDate() + 1);
        }
        unpaidLeaveDays += count;
      }
    }

    // Calculate deduction: dailyRate × unpaidDays
    const emp: any = await (this.prisma as any).employee.findUnique({
      where: { id: employeeId },
      select: { dailyRate: true },
    });

    const dailyRate = parseFloat(String(emp?.dailyRate || 0));
    const unpaidLeaveDeduction = dailyRate * unpaidLeaveDays;

    return { unpaidLeaveDays, unpaidLeaveDeduction };
  }

  /**
   * Resolve the company payroll config version effective for today
   * (raw SQL — the versioned config's tax_brackets JSON is the source of truth).
   */
  private async getEffectiveConfig(companyId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.company_payroll_config_versions
       WHERE company_id = ${companyId}
         AND effective_from <= NOW()
         AND (superseded_at IS NULL OR superseded_at > NOW())
       ORDER BY effective_from DESC
       LIMIT 1`,
    );
    return rows[0] ?? null;
  }

  /**
   * Ethiopian shortcut formula: tax = income × rate − deduct
   * for the bracket containing `income` (not a tiered sum).
   */
  private computeEthiopianTax(
    income: number,
    brackets: Array<{ upTo: number | null; rate: number; deduct: number }>,
  ): number {
    let tax = 0;
    for (let i = 0; i < brackets.length; i++) {
      const b = brackets[i];
      const upTo = b.upTo ?? Infinity;
      if (income <= upTo) {
        tax = income * b.rate - b.deduct;
        break;
      }
    }
    if (tax < 0) tax = 0;
    return Math.round(tax * 100) / 100;
  }

  // ─── Tax Table Management ──────────────────────────────────

  async getTaxTables(companyId: number) {
    return (this.prisma as any).taxTable.findMany({
      where: { companyId },
      include: { brackets: { orderBy: { minIncome: 'asc' as const } } },
      orderBy: { name: 'asc' as const },
    });
  }

  async createTaxTable(
    companyId: number,
    dto: {
      name: string;
      description?: string;
      brackets: Array<{
        minIncome: number;
        maxIncome?: number;
        rate: number;
        fixedAmount?: number;
      }>;
    },
  ) {
    return (this.prisma as any).taxTable.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        brackets: {
          create: dto.brackets.map((b) => ({
            minIncome: b.minIncome,
            maxIncome: b.maxIncome ?? null,
            rate: b.rate,
            fixedAmount: b.fixedAmount ?? 0,
          })),
        },
      },
      include: { brackets: true },
    });
  }

  // ─── Deduction Rules Management ────────────────────────────

  async getDeductions(companyId: number) {
    return (this.prisma as any).payrollDeduction.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' as const },
    });
  }

  async createDeduction(
    companyId: number,
    dto: { name: string; type: string; value: number },
  ) {
    return (this.prisma as any).payrollDeduction.create({
      data: {
        companyId,
        name: dto.name,
        type: dto.type,
        value: dto.value,
      },
    });
  }
}
