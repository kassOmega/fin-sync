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

    // 2. Fetch active deduction rules
    const deductionRules = await (this.prisma as any).payrollDeduction.findMany(
      {
        where: { companyId, isActive: true },
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

        case 'BRACKET': {
          // Find active tax table for this deduction
          const taxTable = await (this.prisma as any).taxTable.findFirst({
            where: { companyId, name: rule.name, isActive: true },
            include: {
              brackets: { orderBy: { minIncome: 'asc' as const } },
            },
          });

          if (taxTable && taxTable.brackets.length > 0) {
            amount = this.computeProgressiveTax(
              taxableIncome,
              taxTable.brackets,
            );
            taxAmount = amount;
          }
          break;
        }

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
   * Compute progressive tax given brackets.
   */
  private computeProgressiveTax(income: number, brackets: any[]): number {
    let remainingIncome = income;
    let totalTax = 0;

    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      const minIncome = Number(bracket.minIncome);
      const maxIncome = bracket.maxIncome
        ? Number(bracket.maxIncome)
        : Infinity;
      const rate = Number(bracket.rate);
      const fixedAmount = Number(bracket.fixedAmount || 0);

      if (remainingIncome <= 0) break;

      const taxableInBracket = Math.min(maxIncome - minIncome, remainingIncome);

      if (taxableInBracket > 0) {
        totalTax += taxableInBracket * (rate / 100) + fixedAmount;
        remainingIncome -= taxableInBracket;
      }
    }

    return totalTax;
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
