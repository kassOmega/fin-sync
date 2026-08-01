import { PrismaClient } from '@prisma/client';
import { SeedContext } from './utils';

const STANDARD_TAX_BRACKETS = [
  { minIncome: 0, maxIncome: 600, rate: 0, fixedAmount: 0 },
  { minIncome: 600, maxIncome: 2500, rate: 10, fixedAmount: 0 },
  { minIncome: 2500, maxIncome: 8000, rate: 20, fixedAmount: 0 },
  { minIncome: 8000, maxIncome: 20000, rate: 30, fixedAmount: 0 },
  { minIncome: 20000, maxIncome: null, rate: 35, fixedAmount: 0 },
];

const DEFAULT_DEDUCTIONS = [
  { name: 'Income Tax', type: 'BRACKET', value: 0 },
  { name: 'Pension (5%)', type: 'PERCENTAGE', value: 5 },
  { name: 'Health Insurance', type: 'FIXED', value: 75 },
  { name: 'Unpaid Leave', type: 'LEAVE_UNPAID', value: 0 },
];

export async function seedPayrollConfig(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('💰 Seeding Payroll Configuration...');

  const companyKeys = Object.keys(ctx.companies);
  let taxCount = 0;
  let deductionCount = 0;

  for (const companyKey of companyKeys) {
    const companyId = Number(ctx.companies[companyKey]);

    // Create tax table
    const existingTax = await (prisma as any).taxTable.findFirst({
      where: { companyId, name: 'Standard 2026' },
    });
    if (!existingTax) {
      await (prisma as any).taxTable.create({
        data: {
          companyId,
          name: 'Standard 2026',
          description: 'Standard progressive income tax brackets',
          brackets: {
            create: STANDARD_TAX_BRACKETS.map((b) => ({
              minIncome: b.minIncome,
              maxIncome: b.maxIncome,
              rate: b.rate,
              fixedAmount: b.fixedAmount,
            })),
          },
        },
      });
      taxCount++;
    }

    // Create deduction rules
    for (const rule of DEFAULT_DEDUCTIONS) {
      const existing = await (prisma as any).payrollDeduction.findFirst({
        where: { companyId, name: rule.name },
      });
      if (!existing) {
        await (prisma as any).payrollDeduction.create({
          data: {
            companyId,
            name: rule.name,
            type: rule.type,
            value: rule.value,
          },
        });
        deductionCount++;
      }
    }
  }

  console.log(
    `   ✅ Seeded ${taxCount} tax tables, ${deductionCount} deduction rules`,
  );
}
