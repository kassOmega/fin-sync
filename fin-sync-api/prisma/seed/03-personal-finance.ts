import { BudgetType, PrismaClient } from '@prisma/client';
import {
  SeedContext,
  daysAgo,
  randomBetween,
  randomInt,
  randomItem,
} from './utils';

interface BudgetData {
  userKey: string;
  category: string;
  amount: number;
  frequency: BudgetType;
  daysAgoStart: number;
}

interface SavingData {
  userKey: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  thresholdAmount: number;
  frequency: BudgetType;
  daysAgoStart: number;
}

interface AccountData {
  userKey: string;
  name: string;
  balance: number;
}

const BUDGETS: BudgetData[] = [
  {
    userKey: 'owner_john',
    category: 'General',
    amount: 3500,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 90,
  },
  {
    userKey: 'owner_john',
    category: 'Dining',
    amount: 400,
    frequency: BudgetType.WEEKLY,
    daysAgoStart: 60,
  },
  {
    userKey: 'owner_john',
    category: 'Transportation',
    amount: 200,
    frequency: BudgetType.WEEKLY,
    daysAgoStart: 45,
  },
  {
    userKey: 'owner_john',
    category: 'Entertainment',
    amount: 150,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 30,
  },
  {
    userKey: 'owner_sarah',
    category: 'General',
    amount: 5000,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 120,
  },
  {
    userKey: 'owner_sarah',
    category: 'Travel',
    amount: 800,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 90,
  },
  {
    userKey: 'owner_sarah',
    category: 'Shopping',
    amount: 300,
    frequency: BudgetType.WEEKLY,
    daysAgoStart: 60,
  },
  {
    userKey: 'owner_mike',
    category: 'General',
    amount: 2800,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 60,
  },
  {
    userKey: 'owner_mike',
    category: 'Farm Supplies',
    amount: 500,
    frequency: BudgetType.WEEKLY,
    daysAgoStart: 30,
  },
  {
    userKey: 'owner_lisa',
    category: 'General',
    amount: 4200,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 90,
  },
  {
    userKey: 'owner_lisa',
    category: 'Fashion',
    amount: 600,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 60,
  },
  {
    userKey: 'pm_alex',
    category: 'General',
    amount: 2200,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 45,
  },
  {
    userKey: 'pm_alex',
    category: 'Food',
    amount: 100,
    frequency: BudgetType.DAILY,
    daysAgoStart: 30,
  },
];

const SAVINGS: SavingData[] = [
  {
    userKey: 'owner_john',
    name: 'Emergency Fund',
    targetAmount: 50000,
    currentAmount: 32400,
    thresholdAmount: 2000,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 365,
  },
  {
    userKey: 'owner_john',
    name: 'Vacation Fund',
    targetAmount: 8000,
    currentAmount: 5200,
    thresholdAmount: 500,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 180,
  },
  {
    userKey: 'owner_john',
    name: 'New Car Down Payment',
    targetAmount: 15000,
    currentAmount: 8750,
    thresholdAmount: 1000,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 240,
  },
  {
    userKey: 'owner_sarah',
    name: 'Investment Fund',
    targetAmount: 100000,
    currentAmount: 67500,
    thresholdAmount: 5000,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 730,
  },
  {
    userKey: 'owner_sarah',
    name: 'Home Renovation',
    targetAmount: 25000,
    currentAmount: 12000,
    thresholdAmount: 2000,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 180,
  },
  {
    userKey: 'owner_mike',
    name: 'Equipment Upgrade',
    targetAmount: 30000,
    currentAmount: 18500,
    thresholdAmount: 1500,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 300,
  },
  {
    userKey: 'owner_lisa',
    name: 'Business Expansion',
    targetAmount: 50000,
    currentAmount: 28000,
    thresholdAmount: 3000,
    frequency: BudgetType.MONTHLY,
    daysAgoStart: 200,
  },
];

const ACCOUNTS: AccountData[] = [
  { userKey: 'owner_john', name: 'Main Checking', balance: 12450.75 },
  { userKey: 'owner_john', name: 'Savings Account', balance: 32400.0 },
  { userKey: 'owner_john', name: 'Cash Wallet', balance: 850.0 },
  { userKey: 'owner_sarah', name: 'Business Account', balance: 45200.5 },
  { userKey: 'owner_sarah', name: 'Personal Checking', balance: 8900.25 },
  { userKey: 'owner_mike', name: 'Farm Account', balance: 23400.0 },
  { userKey: 'owner_mike', name: 'Personal Savings', balance: 18500.0 },
  { userKey: 'owner_lisa', name: 'Boutique Proceeds', balance: 15600.8 },
  { userKey: 'owner_lisa', name: 'Personal Account', balance: 9200.0 },
  { userKey: 'pm_alex', name: 'Salary Account', balance: 4500.0 },
];

const EXPENSE_CATEGORIES = [
  'Dining',
  'Fuel',
  'Groceries',
  'Entertainment',
  'Utilities',
  'Transportation',
  'Shopping',
  'Healthcare',
  'Education',
  'Insurance',
  'Rent',
  'Subscriptions',
  'Personal Care',
  'Home Maintenance',
  'Gifts',
  'Pet Care',
  'Fitness',
  'Misc',
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment Returns',
  'Rental Income',
  'Business Income',
  'Dividends',
  'Refund',
  'Gift Received',
  'Side Hustle',
  'Bonus',
];

export async function seedPersonalFinance(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('💰 Seeding Personal Finance Data...');

  await prisma.personalBudget.createMany({
    data: BUDGETS.map((b) => ({
      userId: ctx.users[b.userKey],
      category: b.category,
      amount: b.amount,
      frequency: b.frequency,
      startDate: daysAgo(b.daysAgoStart),
    })),
  });

  await prisma.personalSaving.createMany({
    data: SAVINGS.map((s) => ({
      userId: ctx.users[s.userKey],
      name: s.name,
      targetAmount: s.targetAmount,
      currentAmount: s.currentAmount,
      thresholdAmount: s.thresholdAmount,
      frequency: s.frequency,
      startDate: daysAgo(s.daysAgoStart),
    })),
  });

  for (const acc of ACCOUNTS) {
    const created = await prisma.personalAccount.create({
      data: {
        userId: ctx.users[acc.userKey],
        name: acc.name,
        balance: acc.balance,
      },
    });
    const key = acc.userKey + '_' + acc.name.toLowerCase().replace(/\s+/g, '_');
    ctx.personalAccounts[key] = created.id;
  }

  const expenseUsers = [
    'owner_john',
    'owner_sarah',
    'owner_mike',
    'owner_lisa',
    'pm_alex',
  ];
  const expensesData: any[] = [];

  for (const userKey of expenseUsers) {
    const userId = ctx.users[userKey];
    const accountKeys = Object.keys(ctx.personalAccounts).filter((k) =>
      k.startsWith(userKey + '_'),
    );

    for (let i = 0; i < 120; i++) {
      const numExpenses = randomInt(0, 3);
      for (let j = 0; j < numExpenses; j++) {
        const category = randomItem(EXPENSE_CATEGORIES);
        let amount: number;
        switch (category) {
          case 'Rent':
            amount = randomBetween(800, 2500, 0);
            break;
          case 'Insurance':
            amount = randomBetween(100, 400, 0);
            break;
          case 'Groceries':
            amount = randomBetween(30, 200);
            break;
          case 'Dining':
            amount = randomBetween(10, 80);
            break;
          case 'Fuel':
            amount = randomBetween(25, 75);
            break;
          case 'Utilities':
            amount = randomBetween(50, 250);
            break;
          case 'Entertainment':
            amount = randomBetween(10, 100);
            break;
          case 'Shopping':
            amount = randomBetween(20, 300);
            break;
          case 'Healthcare':
            amount = randomBetween(25, 500);
            break;
          case 'Subscriptions':
            amount = randomBetween(5, 30);
            break;
          default:
            amount = randomBetween(5, 150);
        }

        const isRecurring = [
          'Rent',
          'Insurance',
          'Subscriptions',
          'Utilities',
        ].includes(category);

        expensesData.push({
          userId,
          accountId:
            accountKeys.length > 0
              ? ctx.personalAccounts[randomItem(accountKeys)]
              : null,
          amount,
          category,
          note: `${category} expense`,
          date: daysAgo(i),
          isCategorized: true,
          isRecurring,
          recurringFrequency: isRecurring ? 'MONTHLY' : null,
        });
      }
    }
  }

  const CHUNK_SIZE = 100;
  for (let i = 0; i < expensesData.length; i += CHUNK_SIZE) {
    await prisma.personalExpense.createMany({
      data: expensesData.slice(i, i + CHUNK_SIZE),
    });
  }

  const incomesData: any[] = [];
  for (const userKey of expenseUsers) {
    const userId = ctx.users[userKey];
    const accountKeys = Object.keys(ctx.personalAccounts).filter((k) =>
      k.startsWith(userKey + '_'),
    );

    for (let i = 0; i < 90; i++) {
      if (i % 30 === 0) {
        incomesData.push({
          userId,
          accountId:
            accountKeys.length > 0
              ? ctx.personalAccounts[randomItem(accountKeys)]
              : null,
          amount: randomBetween(3000, 8000, 0),
          category: 'Salary',
          note: 'Monthly salary',
          date: daysAgo(i),
        });
      }
      if (Math.random() > 0.85) {
        const category = randomItem(
          INCOME_CATEGORIES.filter((c) => c !== 'Salary'),
        );
        incomesData.push({
          userId,
          accountId:
            accountKeys.length > 0
              ? ctx.personalAccounts[randomItem(accountKeys)]
              : null,
          amount: randomBetween(50, 2000),
          category,
          note: `${category} received`,
          date: daysAgo(i),
        });
      }
    }
  }

  for (let i = 0; i < incomesData.length; i += CHUNK_SIZE) {
    await prisma.personalIncome.createMany({
      data: incomesData.slice(i, i + CHUNK_SIZE),
    });
  }

  const transfersData: any[] = [];
  const johnAccounts = Object.keys(ctx.personalAccounts).filter((k) =>
    k.startsWith('owner_john_'),
  );
  const sarahAccounts = Object.keys(ctx.personalAccounts).filter((k) =>
    k.startsWith('owner_sarah_'),
  );

  for (let i = 0; i < 90; i++) {
    if (Math.random() > 0.8 && johnAccounts.length >= 2) {
      const fromAcc = randomItem(johnAccounts);
      const toAcc = randomItem(johnAccounts.filter((a) => a !== fromAcc));
      transfersData.push({
        userId: ctx.users['owner_john'],
        fromAccountId: ctx.personalAccounts[fromAcc],
        toAccountId: ctx.personalAccounts[toAcc],
        amount: randomBetween(100, 1000),
        date: daysAgo(i),
        note: 'Fund transfer',
      });
    }
    if (Math.random() > 0.85 && sarahAccounts.length >= 2) {
      const fromAcc = randomItem(sarahAccounts);
      const toAcc = randomItem(sarahAccounts.filter((a) => a !== fromAcc));
      transfersData.push({
        userId: ctx.users['owner_sarah'],
        fromAccountId: ctx.personalAccounts[fromAcc],
        toAccountId: ctx.personalAccounts[toAcc],
        amount: randomBetween(500, 3000),
        date: daysAgo(i),
        note: 'Savings transfer',
      });
    }
  }

  await prisma.accountTransfer.createMany({ data: transfersData });

  console.log(
    `   ✅ Created ${BUDGETS.length} budgets, ${SAVINGS.length} savings, ${ACCOUNTS.length} accounts`,
  );
  console.log(
    `   ✅ Generated ${expensesData.length} expenses, ${incomesData.length} incomes, ${transfersData.length} transfers`,
  );
}
