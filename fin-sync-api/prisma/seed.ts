import { PrismaPg } from '@prisma/adapter-pg';
import {
  BudgetType,
  EmploymentType,
  ItemCategory,
  MachineryOwnership,
  MachineryStatus,
  PrismaClient,
  StoreTxType,
  SystemRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { URL } from 'url';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('❌ DATABASE_URL environment variable is not set!');
}

const url = new URL(connectionString);
const schema = url.searchParams.get('schema') || 'finsync';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  options: `-c search_path=${schema}`,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

async function main() {
  console.log('🧹 Clearing existing database records...');
  await prisma.notification.deleteMany();
  await prisma.storeRequest.deleteMany();
  await prisma.storeTransaction.deleteMany();
  await prisma.storeItem.deleteMany();
  await prisma.machineryOperator.deleteMany();
  await prisma.machinery.deleteMany();
  await prisma.projectUpdate.deleteMany();
  await prisma.project.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.companyExpense.deleteMany();
  await prisma.companyIncome.deleteMany();
  await prisma.accountTransfer.deleteMany();
  await prisma.personalExpense.deleteMany();
  await prisma.personalIncome.deleteMany();
  await prisma.personalSaving.deleteMany();
  await prisma.personalBudget.deleteMany();
  await prisma.personalAccount.deleteMany();
  await prisma.companyMember.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.measuringUnit.deleteMany();

  console.log('🔑 Hashing default passwords...');
  const commonPassword = await bcrypt.hash('password123', 10);

  // ==========================================
  // MEASURING UNITS
  // ==========================================
  console.log('📐 Creating Measuring Units...');
  await prisma.measuringUnit.create({
    data: { name: 'Kilograms (kg)' },
  });
  const unitLiters = await prisma.measuringUnit.create({
    data: { name: 'Liters (L)' },
  });
  const unitBags = await prisma.measuringUnit.create({
    data: { name: 'Bags' },
  });
  const unitPcs = await prisma.measuringUnit.create({
    data: { name: 'Pieces (pcs)' },
  });
  await prisma.measuringUnit.create({
    data: { name: 'Meters (m)' },
  });
  await prisma.measuringUnit.create({
    data: { name: 'Hours (hrs)' },
  });

  // ==========================================
  // USERS
  // ==========================================
  console.log('👤 Creating Users...');
  const owner1 = await prisma.user.create({
    data: {
      name: 'John Owner',
      email: 'john@finsync.com',
      password: commonPassword,
      role: SystemRole.Owner,
      phone: '+1-555-0100',
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'sarah@horizonlogistics.com',
      password: commonPassword,
      role: SystemRole.Owner,
      phone: '+1-555-0101',
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      name: 'Alex Vance',
      email: 'alex.pm@finsync.com',
      password: commonPassword,
      role: SystemRole.ProjectManager,
      phone: '+1-555-0102',
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena.pm@finsync.com',
      password: commonPassword,
      role: SystemRole.ProjectManager,
      phone: '+1-555-0108',
    },
  });

  const foreman = await prisma.user.create({
    data: {
      name: 'Marcus Brody',
      email: 'marcus.foreman@finsync.com',
      password: commonPassword,
      role: SystemRole.Foreman,
      phone: '+1-555-0103',
    },
  });

  const storekeeper = await prisma.user.create({
    data: {
      name: 'Bob Miller',
      email: 'bob.store@finsync.com',
      password: commonPassword,
      role: SystemRole.Storekeeper,
      phone: '+1-555-0104',
    },
  });

  const cashier = await prisma.user.create({
    data: {
      name: 'Jane Cashier',
      email: 'jane.cashier@finsync.com',
      password: commonPassword,
      role: SystemRole.Cashier,
      phone: '+1-555-0105',
    },
  });

  const operator1 = await prisma.user.create({
    data: {
      name: 'David Heavy',
      email: 'david.op@finsync.com',
      password: commonPassword,
      role: SystemRole.OperatorDriver,
      phone: '+1-555-0106',
    },
  });

  const operator2 = await prisma.user.create({
    data: {
      name: 'Carlos Mendez',
      email: 'carlos.op@finsync.com',
      password: commonPassword,
      role: SystemRole.OperatorDriver,
      phone: '+1-555-0109',
    },
  });

  const salesRep = await prisma.user.create({
    data: {
      name: 'Emma Stone',
      email: 'emma.sales@finsync.com',
      password: commonPassword,
      role: SystemRole.Sales,
      phone: '+1-555-0107',
    },
  });

  // ==========================================
  // COMPANIES & MEMBERSHIPS
  // ==========================================
  console.log('🏢 Creating Companies & Memberships...');
  const buildCo = await prisma.company.create({
    data: {
      name: 'BuildCo Construction',
      industry: 'Commercial Construction',
      currency: 'USD',
      ownerId: owner1.id,
    },
  });

  const horizonLogistics = await prisma.company.create({
    data: {
      name: 'Horizon Freight & Logistics',
      industry: 'Transportation',
      currency: 'USD',
      ownerId: owner2.id,
    },
  });

  const greenAgro = await prisma.company.create({
    data: {
      name: 'GreenValley Farms',
      industry: 'Agriculture',
      currency: 'USD',
      ownerId: owner1.id,
    },
  });

  const urbanThreads = await prisma.company.create({
    data: {
      name: 'Urban Threads Boutique',
      industry: 'Retail / Clothing',
      currency: 'USD',
      ownerId: owner1.id,
    },
  });

  await prisma.companyMember.createMany({
    data: [
      {
        userId: pm1.id,
        companyId: buildCo.id,
        role: SystemRole.ProjectManager,
      },
      {
        userId: pm2.id,
        companyId: buildCo.id,
        role: SystemRole.ProjectManager,
      },
      { userId: foreman.id, companyId: buildCo.id, role: SystemRole.Foreman },
      {
        userId: storekeeper.id,
        companyId: buildCo.id,
        role: SystemRole.Storekeeper,
      },
      { userId: cashier.id, companyId: buildCo.id, role: SystemRole.Cashier },
      {
        userId: operator1.id,
        companyId: buildCo.id,
        role: SystemRole.OperatorDriver,
      },
      {
        userId: operator2.id,
        companyId: buildCo.id,
        role: SystemRole.OperatorDriver,
      },
      {
        userId: salesRep.id,
        companyId: urbanThreads.id,
        role: SystemRole.Sales,
      },
      {
        userId: cashier.id,
        companyId: urbanThreads.id,
        role: SystemRole.Cashier,
      },
      {
        userId: operator1.id,
        companyId: horizonLogistics.id,
        role: SystemRole.OperatorDriver,
      },
    ],
  });

  // ==========================================
  // PERSONAL FINANCE DATA (John Owner)
  // ==========================================
  console.log('💳 Creating Personal Accounts & Transfers...');
  const mainChecking = await prisma.personalAccount.create({
    data: {
      userId: owner1.id,
      name: 'Main Checking (Chase)',
      balance: 18450.0,
    },
  });

  const highYieldSavings = await prisma.personalAccount.create({
    data: { userId: owner1.id, name: 'High-Yield Savings', balance: 45000.0 },
  });

  const cashWallet = await prisma.personalAccount.create({
    data: { userId: owner1.id, name: 'Cash Wallet', balance: 620.0 },
  });

  await prisma.accountTransfer.createMany({
    data: [
      {
        userId: owner1.id,
        fromAccountId: mainChecking.id,
        toAccountId: highYieldSavings.id,
        amount: 2500,
        note: 'Monthly savings contribution',
        date: daysAgo(25),
      },
      {
        userId: owner1.id,
        fromAccountId: mainChecking.id,
        toAccountId: cashWallet.id,
        amount: 300,
        note: 'ATM cash withdrawal',
        date: daysAgo(10),
      },
    ],
  });

  console.log('💰 Creating Personal Incomes, Budgets & Expenses...');
  await prisma.personalIncome.createMany({
    data: [
      {
        userId: owner1.id,
        accountId: mainChecking.id,
        amount: 8500,
        category: 'Owner Dividend',
        note: 'BuildCo Q2 Profit Share',
        date: daysAgo(30),
      },
      {
        userId: owner1.id,
        accountId: mainChecking.id,
        amount: 3200,
        category: 'Owner Dividend',
        note: 'GreenValley Farms Payout',
        date: daysAgo(15),
      },
      {
        userId: owner1.id,
        accountId: highYieldSavings.id,
        amount: 145.5,
        category: 'Interest',
        note: 'Monthly Savings Interest',
        date: daysAgo(2),
      },
    ],
  });

  await prisma.personalBudget.createMany({
    data: [
      {
        userId: owner1.id,
        category: 'Dining & Food',
        amount: 1200,
        frequency: BudgetType.MONTHLY,
        startDate: daysAgo(30),
      },
      {
        userId: owner1.id,
        category: 'Fuel & Transportation',
        amount: 400,
        frequency: BudgetType.MONTHLY,
        startDate: daysAgo(30),
      },
      {
        userId: owner1.id,
        category: 'Entertainment',
        amount: 150,
        frequency: BudgetType.WEEKLY,
        startDate: daysAgo(7),
      },
      {
        userId: owner1.id,
        category: 'Utilities & Subscriptions',
        amount: 500,
        frequency: BudgetType.MONTHLY,
        startDate: daysAgo(30),
      },
    ],
  });

  const personalExpensesData: any[] = [];
  const personalCats = [
    'Dining & Food',
    'Fuel & Transportation',
    'Groceries',
    'Entertainment',
    'Utilities & Subscriptions',
  ];
  const accountIds = [mainChecking.id, cashWallet.id];

  for (let i = 0; i < 45; i++) {
    const isRecurring = i % 15 === 0;
    personalExpensesData.push({
      userId: owner1.id,
      accountId: accountIds[Math.floor(Math.random() * accountIds.length)],
      amount: Math.round((Math.random() * 120 + 15) * 100) / 100,
      category: personalCats[Math.floor(Math.random() * personalCats.length)],
      note: isRecurring
        ? 'Recurring Subscription / Service'
        : 'General personal expense',
      isCategorized: true,
      isRecurring,
      recurringFrequency: isRecurring ? 'MONTHLY' : null,
      date: daysAgo(i),
    });
  }
  await prisma.personalExpense.createMany({ data: personalExpensesData });

  await prisma.personalSaving.createMany({
    data: [
      {
        userId: owner1.id,
        targetAmount: 50000,
        currentAmount: 45000,
        thresholdAmount: 2000,
        frequency: BudgetType.YEARLY,
        startDate: daysAgo(200),
      },
      {
        userId: owner1.id,
        targetAmount: 5000,
        currentAmount: 2100,
        thresholdAmount: 500,
        frequency: BudgetType.MONTHLY,
        startDate: daysAgo(60),
      },
    ],
  });

  // ==========================================
  // PROJECTS & UPDATES
  // ==========================================
  console.log('🏗️ Creating Projects & Updates...');
  const project1 = await prisma.project.create({
    data: {
      companyId: buildCo.id,
      name: 'Downtown Commercial Skyscraper',
      progress: 42.0,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      companyId: buildCo.id,
      name: 'Westside Residential Complex',
      progress: 88.5,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      companyId: buildCo.id,
      name: 'City Center Bridge Overpass',
      progress: 15.0,
    },
  });

  const retailProject = await prisma.project.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Winter Collection Launch',
      progress: 60.0,
    },
  });

  await prisma.projectUpdate.createMany({
    data: [
      {
        projectId: project1.id,
        userId: pm1.id,
        note: 'Foundation pouring completed successfully.',
        newProgress: 25.0,
        date: daysAgo(45),
      },
      {
        projectId: project1.id,
        userId: foreman.id,
        note: 'Steel framing for floors 1 to 5 erected.',
        newProgress: 35.0,
        date: daysAgo(20),
      },
      {
        projectId: project1.id,
        userId: pm1.id,
        note: 'Concrete slab installation for floors 1-3.',
        newProgress: 42.0,
        date: daysAgo(4),
      },
      {
        projectId: project2.id,
        userId: pm2.id,
        note: 'Interior drywalls and plumbing inspected and passed.',
        newProgress: 88.5,
        date: daysAgo(2),
      },
      {
        projectId: project3.id,
        userId: pm2.id,
        note: 'Site clearance and excavation initiated.',
        newProgress: 15.0,
        date: daysAgo(10),
      },
      {
        projectId: retailProject.id,
        userId: salesRep.id,
        note: 'Garment manufacturing completed, distribution started.',
        newProgress: 60.0,
        date: daysAgo(3),
      },
    ],
  });

  // ==========================================
  // MACHINERY & FLEET
  // ==========================================
  console.log('🚜 Creating Machinery & Operators...');
  const excavator = await prisma.machinery.create({
    data: {
      companyId: buildCo.id,
      name: 'CAT 320 Heavy Excavator',
      category: 'Excavation',
      status: MachineryStatus.WORKING,
      ownershipType: MachineryOwnership.OWNED,
      runningHours: 1320.5,
      lastMaintenanceHours: 1200.0,
      projectId: project1.id,
    },
  });

  const crane = await prisma.machinery.create({
    data: {
      companyId: buildCo.id,
      name: 'Liebherr LTM 1120 Crane',
      category: 'Lifting Equipment',
      status: MachineryStatus.MAINTENANCE,
      ownershipType: MachineryOwnership.RENTED,
      runningHours: 910.0,
      lastMaintenanceHours: 900.0,
      projectId: project1.id,
    },
  });

  const bulldozer = await prisma.machinery.create({
    data: {
      companyId: buildCo.id,
      name: 'Komatsu D85 Crawler Dozer',
      category: 'Earthmoving',
      status: MachineryStatus.WORKING,
      ownershipType: MachineryOwnership.OWNED,
      runningHours: 640.0,
      lastMaintenanceHours: 500.0,
      projectId: project3.id,
    },
  });

  await prisma.machinery.create({
    data: {
      companyId: greenAgro.id,
      name: 'John Deere 6R Tractor',
      category: 'Farming Equipment',
      status: MachineryStatus.IDLE,
      ownershipType: MachineryOwnership.OWNED,
      runningHours: 450.0,
      lastMaintenanceHours: 400.0,
    },
  });

  await prisma.machineryOperator.createMany({
    data: [
      { machineryId: excavator.id, userId: operator1.id, isHelper: false },
      { machineryId: crane.id, userId: operator1.id, isHelper: false },
      { machineryId: crane.id, userId: operator2.id, isHelper: true },
      { machineryId: bulldozer.id, userId: operator2.id, isHelper: false },
    ],
  });

  // ==========================================
  // COMPANY FINANCE
  // ==========================================
  console.log('💵 Generating Bulk Financial Records for Companies...');
  const companyExpensesData: any[] = [];
  const companyIncomesData: any[] = [];

  const expenseCats = [
    'Fuel',
    'Salary',
    'Materials',
    'Rent',
    'Utilities',
    'Maintenance',
    'Equipment Rental',
  ];
  const incomeCats = [
    'Client Milestone Payment',
    'Consulting Service',
    'Rental Income',
    'Sales',
  ];

  for (let i = 0; i < 60; i++) {
    // BuildCo Expenses & Incomes
    if (Math.random() > 0.2) {
      companyExpensesData.push({
        companyId: buildCo.id,
        registeredBy: cashier.id,
        amount: Math.round((Math.random() * 3500 + 200) * 100) / 100,
        category: expenseCats[Math.floor(Math.random() * expenseCats.length)],
        note: `Project operational expense #${i + 1}`,
        projectId: Math.random() > 0.5 ? project1.id : project2.id,
        machineryId: Math.random() > 0.6 ? excavator.id : null,
        measuringUnitId: unitLiters.id,
        unit: 'Liters',
        isRecurring: i % 10 === 0,
        recurringFrequency: i % 10 === 0 ? 'MONTHLY' : null,
        date: daysAgo(i),
      });
    }

    if (Math.random() > 0.6) {
      companyIncomesData.push({
        companyId: buildCo.id,
        registeredBy: owner1.id,
        amount: Math.round((Math.random() * 25000 + 5000) * 100) / 100,
        category: incomeCats[Math.floor(Math.random() * incomeCats.length)],
        note: 'Project installment received',
        projectId: project1.id,
        date: daysAgo(i),
      });
    }

    // Urban Threads Retail Incomes (Daily POS Sales)
    if (Math.random() > 0.1) {
      companyIncomesData.push({
        companyId: urbanThreads.id,
        registeredBy: salesRep.id,
        amount: Math.round((Math.random() * 1200 + 100) * 100) / 100,
        category: 'Sales',
        note: 'Daily POS Retail Sales',
        date: daysAgo(i),
      });
    }
  }

  // Large explicit milestone payment
  companyIncomesData.push({
    companyId: buildCo.id,
    registeredBy: owner1.id,
    amount: 185000,
    category: 'Client Milestone Payment',
    note: 'Phase 2 Completion Milestone for Downtown Skyscraper',
    projectId: project1.id,
    date: daysAgo(12),
  });

  await prisma.companyExpense.createMany({ data: companyExpensesData });
  await prisma.companyIncome.createMany({ data: companyIncomesData });

  // ==========================================
  // HR & EMPLOYEES
  // ==========================================
  console.log('👷 Creating Employees...');
  await prisma.employee.createMany({
    data: [
      {
        companyId: buildCo.id,
        name: 'Carlos Ruiz',
        employmentType: EmploymentType.PERMANENT,
        wage: 4500,
        nextPayDate: daysAgo(-5),
      },
      {
        companyId: buildCo.id,
        name: "Liam O'Connor",
        employmentType: EmploymentType.DAILY_LABORER,
        wage: 75,
        nextPayDate: daysAgo(-1),
      },
      {
        companyId: buildCo.id,
        name: 'Samira Patel',
        employmentType: EmploymentType.DAILY_LABORER,
        wage: 80,
        nextPayDate: daysAgo(-1),
      },
      {
        companyId: greenAgro.id,
        name: 'Jacob Thorne',
        employmentType: EmploymentType.PERMANENT,
        wage: 3200,
        nextPayDate: daysAgo(-10),
      },
      {
        companyId: urbanThreads.id,
        name: 'Retail Store Associate',
        employmentType: EmploymentType.PERMANENT,
        wage: 2800,
        nextPayDate: daysAgo(-3),
      },
    ],
  });

  // ==========================================
  // INVENTORY, TRANSACTIONS & REQUESTS
  // ==========================================
  console.log('📦 Creating Store Items, Requests & Transactions...');
  const cement = await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Portland Cement Bags (50kg)',
      category: ItemCategory.CONSUMABLE,
      quantity: 320,
      lowStockThreshold: 100,
      unit: 'bags',
      measuringUnitId: unitBags.id,
    },
  });

  const rebar = await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Steel Rebar T12 (12m)',
      category: ItemCategory.CONSUMABLE,
      quantity: 12, // Low stock triggered!
      lowStockThreshold: 50,
      unit: 'pieces',
      measuringUnitId: unitPcs.id,
    },
  });

  const jackhammer = await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Bosch Industrial Jackhammer',
      category: ItemCategory.TOOL,
      quantity: 5,
      lowStockThreshold: 2,
      unit: 'pcs',
      measuringUnitId: unitPcs.id,
    },
  });

  const dieselFuel = await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Industrial Diesel Fuel',
      category: ItemCategory.CONSUMABLE,
      quantity: 450,
      lowStockThreshold: 1000, // Low stock triggered!
      unit: 'liters',
      measuringUnitId: unitLiters.id,
    },
  });

  await prisma.storeItem.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Cotton T-Shirts (Assorted Sizes)',
      category: ItemCategory.CONSUMABLE,
      quantity: 210,
      lowStockThreshold: 30,
      unit: 'pcs',
      measuringUnitId: unitPcs.id,
    },
  });

  await prisma.storeTransaction.createMany({
    data: [
      {
        itemId: cement.id,
        companyId: buildCo.id,
        type: StoreTxType.RESTOCK,
        quantity: 500,
        status: 'APPROVED',
        date: daysAgo(40),
      },
      {
        itemId: cement.id,
        companyId: buildCo.id,
        type: StoreTxType.ISSUE,
        quantity: 180,
        issuedToUserId: foreman.id,
        status: 'APPROVED',
        date: daysAgo(15),
      },
      {
        itemId: dieselFuel.id,
        companyId: buildCo.id,
        type: StoreTxType.RESTOCK,
        quantity: 2000,
        status: 'APPROVED',
        date: daysAgo(30),
      },
      {
        itemId: dieselFuel.id,
        companyId: buildCo.id,
        type: StoreTxType.ISSUE,
        quantity: 1550,
        issuedToUserId: operator1.id,
        status: 'APPROVED',
        date: daysAgo(5),
      },
      {
        itemId: jackhammer.id,
        companyId: buildCo.id,
        type: StoreTxType.ISSUE,
        quantity: 1,
        issuedToUserId: operator2.id,
        status: 'APPROVED',
        date: daysAgo(8),
      },
      {
        itemId: jackhammer.id,
        companyId: buildCo.id,
        type: StoreTxType.RETURN,
        quantity: 1,
        issuedToUserId: operator2.id,
        status: 'APPROVED',
        date: daysAgo(2),
      },
    ],
  });

  await prisma.storeRequest.createMany({
    data: [
      {
        itemId: rebar.id,
        companyId: buildCo.id,
        userId: foreman.id,
        quantity: 100,
        status: 'PENDING',
      },
      {
        itemId: dieselFuel.id,
        companyId: buildCo.id,
        userId: operator1.id,
        quantity: 500,
        status: 'PENDING',
      },
      {
        itemId: jackhammer.id,
        companyId: buildCo.id,
        userId: operator2.id,
        quantity: 1,
        status: 'APPROVED',
      },
    ],
  });

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  console.log('🔔 Creating Notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: owner1.id,
        title: '⚠️ Low Stock Warning',
        message:
          'Steel Rebar T12 quantity (12 pcs) is below threshold (50 pcs).',
        isRead: false,
      },
      {
        userId: owner1.id,
        title: '⚠️ Fuel Level Alert',
        message:
          'Industrial Diesel Fuel quantity (450 L) is below threshold (1000 L).',
        isRead: false,
      },
      {
        userId: owner1.id,
        title: '📅 Payroll Due Reminder',
        message: 'Daily wage payment due tomorrow for 2 laborers.',
        isRead: true,
      },
      {
        userId: storekeeper.id,
        title: '📦 Pending Store Requisition',
        message: 'Marcus Brody requested 100 Steel Rebar T12 pieces.',
        isRead: false,
      },
      {
        userId: pm1.id,
        title: '🔧 Equipment Maintenance Status',
        message: 'Liebherr LTM 1120 Crane status updated to MAINTENANCE.',
        isRead: false,
      },
    ],
  });

  console.log('🎉 Comprehensive database seed successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
