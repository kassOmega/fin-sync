import { PrismaClient } from '@prisma/client';
import { SeedContext } from './utils';

interface CoaAccount {
  code: string;
  name: string;
  type: string;
  category: string;
  normalSide: string;
  children?: CoaAccount[];
}

const STANDARD_CHART_OF_ACCOUNTS: CoaAccount[] = [
  // ==================== ASSETS (1000–1999) ====================
  {
    code: '1000',
    name: 'Current Assets',
    type: 'ASSET',
    category: 'Current Assets',
    normalSide: 'DEBIT',
    children: [
      {
        code: '1001',
        name: 'Cash on Hand',
        type: 'ASSET',
        category: 'Current Assets',
        normalSide: 'DEBIT',
      },
      {
        code: '1002',
        name: 'Bank Account',
        type: 'ASSET',
        category: 'Current Assets',
        normalSide: 'DEBIT',
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'ASSET',
        category: 'Current Assets',
        normalSide: 'DEBIT',
      },
      {
        code: '1200',
        name: 'Inventory',
        type: 'ASSET',
        category: 'Current Assets',
        normalSide: 'DEBIT',
        children: [
          {
            code: '1201',
            name: 'Raw Materials Inventory',
            type: 'ASSET',
            category: 'Current Assets',
            normalSide: 'DEBIT',
          },
          {
            code: '1202',
            name: 'Finished Goods Inventory',
            type: 'ASSET',
            category: 'Current Assets',
            normalSide: 'DEBIT',
          },
          {
            code: '1203',
            name: 'Work in Progress',
            type: 'ASSET',
            category: 'Current Assets',
            normalSide: 'DEBIT',
          },
        ],
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'ASSET',
        category: 'Current Assets',
        normalSide: 'DEBIT',
      },
    ],
  },
  {
    code: '1500',
    name: 'Fixed Assets',
    type: 'ASSET',
    category: 'Fixed Assets',
    normalSide: 'DEBIT',
    children: [
      {
        code: '1501',
        name: 'Land',
        type: 'ASSET',
        category: 'Fixed Assets',
        normalSide: 'DEBIT',
      },
      {
        code: '1502',
        name: 'Buildings',
        type: 'ASSET',
        category: 'Fixed Assets',
        normalSide: 'DEBIT',
      },
      {
        code: '1510',
        name: 'Machinery & Equipment',
        type: 'ASSET',
        category: 'Fixed Assets',
        normalSide: 'DEBIT',
      },
      {
        code: '1520',
        name: 'Vehicles',
        type: 'ASSET',
        category: 'Fixed Assets',
        normalSide: 'DEBIT',
      },
      {
        code: '1530',
        name: 'Office Equipment',
        type: 'ASSET',
        category: 'Fixed Assets',
        normalSide: 'DEBIT',
      },
      {
        code: '1550',
        name: 'Accumulated Depreciation',
        type: 'ASSET',
        category: 'Fixed Assets',
        normalSide: 'CREDIT',
      },
    ],
  },

  // ==================== LIABILITIES (2000–2999) ====================
  {
    code: '2000',
    name: 'Current Liabilities',
    type: 'LIABILITY',
    category: 'Current Liabilities',
    normalSide: 'CREDIT',
    children: [
      {
        code: '2001',
        name: 'Accounts Payable',
        type: 'LIABILITY',
        category: 'Current Liabilities',
        normalSide: 'CREDIT',
      },
      {
        code: '2100',
        name: 'Accrued Expenses',
        type: 'LIABILITY',
        category: 'Current Liabilities',
        normalSide: 'CREDIT',
      },
      {
        code: '2200',
        name: 'Salaries Payable',
        type: 'LIABILITY',
        category: 'Current Liabilities',
        normalSide: 'CREDIT',
      },
      {
        code: '2300',
        name: 'Tax Payable',
        type: 'LIABILITY',
        category: 'Current Liabilities',
        normalSide: 'CREDIT',
      },
      {
        code: '2400',
        name: 'Short-Term Loans',
        type: 'LIABILITY',
        category: 'Current Liabilities',
        normalSide: 'CREDIT',
      },
    ],
  },
  {
    code: '2500',
    name: 'Long-Term Liabilities',
    type: 'LIABILITY',
    category: 'Long-Term Liabilities',
    normalSide: 'CREDIT',
    children: [
      {
        code: '2501',
        name: 'Long-Term Bank Loan',
        type: 'LIABILITY',
        category: 'Long-Term Liabilities',
        normalSide: 'CREDIT',
      },
      {
        code: '2510',
        name: 'Equipment Financing',
        type: 'LIABILITY',
        category: 'Long-Term Liabilities',
        normalSide: 'CREDIT',
      },
    ],
  },

  // ==================== EQUITY (3000–3999) ====================
  {
    code: '3000',
    name: "Owner's Equity",
    type: 'EQUITY',
    category: 'Equity',
    normalSide: 'CREDIT',
    children: [
      {
        code: '3001',
        name: 'Share Capital',
        type: 'EQUITY',
        category: 'Equity',
        normalSide: 'CREDIT',
      },
      {
        code: '3100',
        name: 'Retained Earnings',
        type: 'EQUITY',
        category: 'Equity',
        normalSide: 'CREDIT',
      },
      {
        code: '3200',
        name: "Owner's Drawings",
        type: 'EQUITY',
        category: 'Equity',
        normalSide: 'DEBIT',
      },
    ],
  },

  // ==================== INCOME (4000–4999) ====================
  {
    code: '4000',
    name: 'Operating Revenue',
    type: 'INCOME',
    category: 'Revenue',
    normalSide: 'CREDIT',
    children: [
      {
        code: '4001',
        name: 'Sales Revenue',
        type: 'INCOME',
        category: 'Revenue',
        normalSide: 'CREDIT',
      },
      {
        code: '4100',
        name: 'Service Income',
        type: 'INCOME',
        category: 'Revenue',
        normalSide: 'CREDIT',
      },
      {
        code: '4200',
        name: 'Contract Revenue',
        type: 'INCOME',
        category: 'Revenue',
        normalSide: 'CREDIT',
      },
      {
        code: '4300',
        name: 'Equipment Rental Income',
        type: 'INCOME',
        category: 'Revenue',
        normalSide: 'CREDIT',
      },
    ],
  },
  {
    code: '4500',
    name: 'Other Income',
    type: 'INCOME',
    category: 'Revenue',
    normalSide: 'CREDIT',
    children: [
      {
        code: '4501',
        name: 'Interest Income',
        type: 'INCOME',
        category: 'Revenue',
        normalSide: 'CREDIT',
      },
      {
        code: '4510',
        name: 'Gain on Asset Sale',
        type: 'INCOME',
        category: 'Revenue',
        normalSide: 'CREDIT',
      },
    ],
  },

  // ==================== EXPENSES (5000–5999) ====================
  {
    code: '5000',
    name: 'Cost of Goods Sold',
    type: 'EXPENSE',
    category: 'Direct Expenses',
    normalSide: 'DEBIT',
    children: [
      {
        code: '5001',
        name: 'COGS - Materials',
        type: 'EXPENSE',
        category: 'Direct Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5010',
        name: 'COGS - Direct Labor',
        type: 'EXPENSE',
        category: 'Direct Expenses',
        normalSide: 'DEBIT',
      },
    ],
  },
  {
    code: '5100',
    name: 'Operating Expenses',
    type: 'EXPENSE',
    category: 'Operating Expenses',
    normalSide: 'DEBIT',
    children: [
      {
        code: '5101',
        name: 'Salaries & Wages',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5110',
        name: 'Rent Expense',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5120',
        name: 'Utilities',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5130',
        name: 'Fuel & Transportation',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5140',
        name: 'Maintenance & Repairs',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5150',
        name: 'Insurance Expense',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5160',
        name: 'Office Supplies',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5170',
        name: 'Professional Fees',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5180',
        name: 'Marketing & Advertising',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5190',
        name: 'Travel & Entertainment',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5200',
        name: 'Depreciation Expense',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5210',
        name: 'Taxes & Licenses',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5220',
        name: 'Interest Expense',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
      {
        code: '5230',
        name: 'Miscellaneous Expense',
        type: 'EXPENSE',
        category: 'Operating Expenses',
        normalSide: 'DEBIT',
      },
    ],
  },
];

/**
 * Flattens the hierarchical CoA into a list of flat accounts,
 * tracking parent relationships for later re-parenting.
 */
function flattenAccounts(
  accounts: CoaAccount[],
  parentCode?: string,
): Array<CoaAccount & { parentCode?: string }> {
  const result: Array<CoaAccount & { parentCode?: string }> = [];

  for (const acc of accounts) {
    result.push({ ...acc, parentCode });
    if (acc.children && acc.children.length > 0) {
      result.push(...flattenAccounts(acc.children, acc.code));
    }
  }

  return result;
}

export async function seedChartOfAccounts(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('📊 Seeding Chart of Accounts...');

  // Guard: if the seed client doesn't have the Account model (deploy with stale client),
  // skip gracefully rather than crash the whole deploy.
  if (!(prisma as any).account) {
    console.log('⚠️ Account model not available on client — skipping COA seed');
    return;
  }

  const companyKeys = Object.keys(ctx.companies);
  const flatAccounts = flattenAccounts(STANDARD_CHART_OF_ACCOUNTS);

  for (const companyKey of companyKeys) {
    const companyId = Number(ctx.companies[companyKey]);

    // First pass: create all accounts (without parent references)
    const createdMap = new Map<string, number>();

    for (const acc of flatAccounts) {
      const result: any = await (prisma as any).account.create({
        data: {
          companyId,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          category: acc.category,
          normalSide: acc.normalSide,
          isActive: true,
        },
      });
      createdMap.set(acc.code, result.id);
    }

    // Second pass: set parent relationships
    for (const acc of flatAccounts) {
      if (acc.parentCode && createdMap.has(acc.parentCode)) {
        const accId = createdMap.get(acc.code);
        const parentId = createdMap.get(acc.parentCode);
        if (accId && parentId) {
          await (prisma as any).account.update({
            where: { id: accId },
            data: { parentId },
          });
        }
      }
    }
  }

  console.log(
    `   ✅ Seeded ${flatAccounts.length} accounts across ${companyKeys.length} companies`,
  );
}
