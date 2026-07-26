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

dotenv.config();
// 1. Initialize Postgres Pool & Driver Adapter
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('❌ DATABASE_URL environment variable is not set!');
}
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});
const adapter = new PrismaPg(pool);

// 2. Pass Adapter to PrismaClient
const prisma = new PrismaClient({ adapter });

// Helper to get dates relative to today for realistic charts
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
  await prisma.personalSaving.deleteMany();
  await prisma.personalBudget.deleteMany();
  await prisma.personalExpense.deleteMany();
  await prisma.companyMember.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log('🔑 Hashing default passwords...');
  const commonPassword = await bcrypt.hash('password123', 10);

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

  const pm = await prisma.user.create({
    data: {
      name: 'Alex Vance',
      email: 'alex.pm@finsync.com',
      password: commonPassword,
      role: SystemRole.ProjectManager,
      phone: '+1-555-0102',
    },
  });

  // BUG FIX: Password was accidentally set to the string 'Foreman' instead of the hash
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

  const operator = await prisma.user.create({
    data: {
      name: 'David Heavy',
      email: 'david.op@finsync.com',
      password: commonPassword,
      role: SystemRole.OperatorDriver,
      phone: '+1-555-0106',
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
      ownerId: owner1.id, // Multi-company owner
    },
  });

  // New Retail Company to satisfy PRD Scenario 2
  const urbanThreads = await prisma.company.create({
    data: {
      name: 'Urban Threads Boutique',
      industry: 'Retail / Clothing',
      currency: 'USD',
      ownerId: owner1.id,
    },
  });

  // Assign staff to BuildCo
  await prisma.companyMember.createMany({
    data: [
      { userId: pm.id, companyId: buildCo.id, role: SystemRole.ProjectManager },
      { userId: foreman.id, companyId: buildCo.id, role: SystemRole.Foreman },
      {
        userId: storekeeper.id,
        companyId: buildCo.id,
        role: SystemRole.Storekeeper,
      },
      { userId: cashier.id, companyId: buildCo.id, role: SystemRole.Cashier },
      {
        userId: operator.id,
        companyId: buildCo.id,
        role: SystemRole.OperatorDriver,
      },
    ],
  });

  // Assign staff to Urban Threads
  await prisma.companyMember.createMany({
    data: [
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
    ],
  });

  // ==========================================
  // PERSONAL FINANCE DATA (John Owner)
  // ==========================================
  console.log('💰 Creating Personal Finance Data...');
  await prisma.personalBudget.createMany({
    data: [
      {
        userId: owner1.id,
        type: BudgetType.MONTHLY,
        amount: 3500,
        startDate: daysAgo(30),
        carriedOverAmount: 120,
      },
      {
        userId: owner1.id,
        type: BudgetType.WEEKLY,
        amount: 400,
        startDate: daysAgo(7),
      },
    ],
  });

  // Generate 30 days of personal expenses for nice charts
  const personalExpensesData: any[] = [];
  const personalCategories = [
    'Dining',
    'Fuel',
    'Groceries',
    'Entertainment',
    'Utilities',
    'Misc',
  ];
  for (let i = 0; i < 30; i++) {
    personalExpensesData.push({
      userId: owner1.id,
      amount: Math.round((Math.random() * 80 + 10) * 100) / 100,
      category:
        personalCategories[
          Math.floor(Math.random() * personalCategories.length)
        ],
      note: 'Auto-generated expense',
      isCategorized: Math.random() > 0.2,
      date: daysAgo(i),
    });
  }
  await prisma.personalExpense.createMany({ data: personalExpensesData });

  await prisma.personalSaving.createMany({
    data: [
      {
        userId: owner1.id,
        targetAmount: 15000,
        currentAmount: 8400,
        thresholdAmount: 1000,
        frequency: BudgetType.MONTHLY,
        startDate: daysAgo(180),
      },
      {
        userId: owner1.id,
        targetAmount: 3000,
        currentAmount: 2100,
        thresholdAmount: 300,
        frequency: BudgetType.WEEKLY,
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
      progress: 35.0,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      companyId: buildCo.id,
      name: 'Westside Residential Complex',
      progress: 78.5,
    },
  });

  const retailProject = await prisma.project.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Winter Collection Launch',
      progress: 45.0,
    },
  });

  await prisma.projectUpdate.createMany({
    data: [
      {
        projectId: project1.id,
        userId: pm.id,
        note: 'Foundation pouring completed.',
        newProgress: 25.0,
        date: daysAgo(40),
      },
      {
        projectId: project1.id,
        userId: foreman.id,
        note: 'Steel framing levels 1-3 erected.',
        newProgress: 35.0,
        date: daysAgo(7),
      },
      {
        projectId: project2.id,
        userId: pm.id,
        note: 'Interior drywalls verified.',
        newProgress: 78.5,
        date: daysAgo(3),
      },
      {
        projectId: retailProject.id,
        userId: salesRep.id,
        note: ' Designs finalized, production started.',
        newProgress: 45.0,
        date: daysAgo(5),
      },
    ],
  });

  // ==========================================
  // MACHINERY & FLEET (Including Ownership Types)
  // ==========================================
  console.log('🚜 Creating Machinery & Operators...');
  const excavator = await prisma.machinery.create({
    data: {
      companyId: buildCo.id,
      name: 'CAT 320 Heavy Excavator',
      category: 'Excavation',
      status: MachineryStatus.WORKING,
      ownershipType: MachineryOwnership.OWNED,
      runningHours: 1240.5,
      lastMaintenanceHours: 1100.0,
      projectId: project1.id,
    },
  });

  const crane = await prisma.machinery.create({
    data: {
      companyId: buildCo.id,
      name: 'Liebherr LTM 1120 Crane',
      category: 'Lifting Equipment',
      status: MachineryStatus.MAINTENANCE,
      ownershipType: MachineryOwnership.RENTED, // Rented machine!
      runningHours: 850.0,
      lastMaintenanceHours: 850.0,
      projectId: project1.id,
    },
  });

  await prisma.machinery.create({
    data: {
      companyId: greenAgro.id,
      name: 'John Deere 6R Tractor',
      category: 'Farming Equipment',
      status: MachineryStatus.IDLE,
      ownershipType: MachineryOwnership.OWNED,
      runningHours: 410.0,
      lastMaintenanceHours: 350.0,
    },
  });

  await prisma.machineryOperator.createMany({
    data: [
      { machineryId: excavator.id, userId: operator.id, isHelper: false },
      { machineryId: crane.id, userId: operator.id, isHelper: false },
    ],
  });

  // ==========================================
  // COMPANY FINANCE (Bulk Data for Charts)
  // ==========================================
  console.log('💳 Generating 90 days of Company Financial Records...');
  const companyExpensesData: any[] = [];
  const companyIncomesData: any[] = [];
  const expenseCats = [
    'Fuel',
    'Salary',
    'Materials',
    'Rent',
    'Utilities',
    'Maintenance',
    'Misc',
  ];
  const incomeCats = [
    'Sales',
    'Client Milestone Payment',
    'Service',
    'Rental Income',
  ];

  for (let i = 0; i < 90; i++) {
    // BuildCo Expenses
    if (Math.random() > 0.3) {
      companyExpensesData.push({
        companyId: buildCo.id,
        registeredBy: cashier.id,
        amount: Math.round((Math.random() * 2000 + 100) * 100) / 100,
        category: expenseCats[Math.floor(Math.random() * expenseCats.length)],
        note: 'Auto-gen',
        date: daysAgo(i),
      });
    }
    // BuildCo Income
    if (Math.random() > 0.7) {
      companyIncomesData.push({
        companyId: buildCo.id,
        registeredBy: owner1.id,
        amount: Math.round((Math.random() * 10000 + 1000) * 100) / 100,
        category: incomeCats[Math.floor(Math.random() * incomeCats.length)],
        note: 'Auto-gen',
        date: daysAgo(i),
      });
    }
    // Urban Threads (Retail) Expenses
    if (Math.random() > 0.5) {
      companyExpensesData.push({
        companyId: urbanThreads.id,
        registeredBy: cashier.id,
        amount: Math.round((Math.random() * 500 + 20) * 100) / 100,
        category: ['Purchasing', 'Rent', 'Utilities'][
          Math.floor(Math.random() * 3)
        ],
        note: 'Auto-gen',
        date: daysAgo(i),
      });
    }
    // Urban Threads (Retail) Income (Sales)
    if (Math.random() > 0.2) {
      companyIncomesData.push({
        companyId: urbanThreads.id,
        registeredBy: salesRep.id,
        amount: Math.round((Math.random() * 800 + 50) * 100) / 100,
        category: 'Sales',
        note: 'POS Transaction',
        date: daysAgo(i),
      });
    }
  }

  // Add specific large milestone manually for context
  companyIncomesData.push({
    companyId: buildCo.id,
    registeredBy: owner1.id,
    amount: 150000,
    category: 'Client Milestone Payment',
    note: 'Milestone 2 payment for Downtown Skyscraper',
    projectId: project1.id,
    date: daysAgo(20),
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
        wage: 4200,
        nextPayDate: daysAgo(-5),
      },
      {
        companyId: buildCo.id,
        name: "Liam O'Connor",
        employmentType: EmploymentType.DAILY_LABORER,
        wage: 65,
        nextPayDate: daysAgo(-1),
      },
      {
        companyId: buildCo.id,
        name: 'Samira Patel',
        employmentType: EmploymentType.DAILY_LABORER,
        wage: 70,
        nextPayDate: daysAgo(-1),
      },
      {
        companyId: urbanThreads.id,
        name: 'Retail Staff 1',
        employmentType: EmploymentType.PERMANENT,
        wage: 2500,
        nextPayDate: daysAgo(-5),
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
      quantity: 250,
      lowStockThreshold: 50,
      unit: 'bags', // Added unit
    },
  });

  const rebar = await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Steel Rebar T12 (12m)',
      category: ItemCategory.CONSUMABLE,
      quantity: 18, // Below low stock threshold!
      lowStockThreshold: 30,
      unit: 'pieces',
    },
  });

  const jackhammer = await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Bosch Industrial Jackhammer',
      category: ItemCategory.TOOL,
      quantity: 4,
      lowStockThreshold: 1,
      unit: 'pcs',
    },
  });

  await prisma.storeItem.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Cotton T-Shirts (Assorted)',
      category: ItemCategory.CONSUMABLE,
      quantity: 120,
      lowStockThreshold: 20,
      unit: 'pcs',
    },
  });

  await prisma.storeTransaction.createMany({
    data: [
      {
        itemId: cement.id,
        companyId: buildCo.id,
        type: StoreTxType.RESTOCK,
        quantity: 300,
        status: 'APPROVED',
        date: daysAgo(30),
      },
      {
        itemId: cement.id,
        companyId: buildCo.id,
        type: StoreTxType.ISSUE,
        quantity: 50,
        issuedToUserId: foreman.id,
        status: 'APPROVED',
        date: daysAgo(20),
      },
      {
        itemId: jackhammer.id,
        companyId: buildCo.id,
        type: StoreTxType.ISSUE,
        quantity: 1,
        issuedToUserId: operator.id,
        status: 'APPROVED',
        date: daysAgo(10),
      },
    ],
  });

  await prisma.storeRequest.createMany({
    data: [
      {
        itemId: rebar.id,
        companyId: buildCo.id,
        userId: foreman.id,
        quantity: 40,
        status: 'PENDING',
      },
      {
        itemId: jackhammer.id,
        companyId: buildCo.id,
        userId: operator.id,
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
        title: '⚠️ Low Stock Alert',
        message: 'Steel Rebar T12 quantity (18) is below threshold (30).',
        isRead: false,
      },
      {
        userId: owner1.id,
        title: '📅 Daily Wage Due',
        message: 'Payment due tomorrow for 2 daily laborers.',
        isRead: false,
      },
      {
        userId: storekeeper.id,
        title: '📦 New Store Request',
        message: 'Marcus Brody requested 40 Steel Rebar T12.',
        isRead: true,
      },
      {
        userId: pm.id,
        title: '🔧 Equipment Maintenance Needed',
        message: 'Liebherr Crane status updated to MAINTENANCE.',
        isRead: false,
      },
    ],
  });

  console.log('✅ Rich, dynamic relational seeds inserted successfully!');
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
