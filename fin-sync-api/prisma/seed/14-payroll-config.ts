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

    // Create tax table via raw SQL (company-linked, works with stale client)
    const existingTax: { id: number }[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM finsync.tax_tables WHERE "companyId" = ${companyId} AND name = 'Standard 2026' LIMIT 1`,
    );
    if (existingTax.length === 0) {
      const insertedTax: { id: number }[] = await prisma.$queryRawUnsafe(
        `INSERT INTO finsync.tax_tables ("companyId", name, description, "isActive")
         VALUES (${companyId}, 'Standard 2026', 'Standard progressive income tax brackets', true)
         RETURNING id`,
      );
      const taxTableId = insertedTax[0].id;
      for (const b of STANDARD_TAX_BRACKETS) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO finsync.tax_brackets ("taxTableId", "minIncome", "maxIncome", rate, "fixedAmount")
           VALUES (${taxTableId}, ${b.minIncome}, ${b.maxIncome ?? 'NULL'}, ${b.rate}, ${b.fixedAmount})`,
        );
      }
      taxCount++;
    }

    // Create deduction rules via raw SQL
    for (const rule of DEFAULT_DEDUCTIONS) {
      const existing: { id: number }[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM finsync.payroll_deductions WHERE "companyId" = ${companyId} AND name = '${rule.name}' LIMIT 1`,
      );
      if (existing.length === 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO finsync.payroll_deductions ("companyId", name, type, value)
           VALUES (${companyId}, '${rule.name}', '${rule.type}', ${rule.value})`,
        );
        deductionCount++;
      }
    }
  }

  console.log(
    `   ✅ Seeded ${taxCount} tax tables, ${deductionCount} deduction rules`,
  );
}
