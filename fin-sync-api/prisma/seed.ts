import { PrismaPg } from '@prisma/adapter-pg';
import {
  BudgetType,
  CompanyType,
  EmploymentType,
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
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.supplier.deleteMany();
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
  await prisma.measuringUnit.create({ data: { name: 'Kilograms (kg)' } });
  const unitLiters = await prisma.measuringUnit.create({
    data: { name: 'Liters (L)' },
  });
  const unitBags = await prisma.measuringUnit.create({
    data: { name: 'Bags' },
  });
  const unitPcs = await prisma.measuringUnit.create({
    data: { name: 'Pieces (pcs)' },
  });
  await prisma.measuringUnit.create({ data: { name: 'Meters (m)' } });
  await prisma.measuringUnit.create({ data: { name: 'Hours (hrs)' } });

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
  // COMPANIES — different types!
  // ==========================================
  console.log('🏢 Creating Companies & Memberships...');
  const buildCo = await prisma.company.create({
    data: {
      name: 'BuildCo Construction',
      industry: 'Commercial Construction',
      type: CompanyType.CONSTRUCTION,
      currency: 'USD',
      ownerId: owner1.id,
    },
  });
  const horizonLogistics = await prisma.company.create({
    data: {
      name: 'Horizon Freight & Logistics',
      industry: 'Transportation',
      type: CompanyType.LOGISTICS,
      currency: 'USD',
      ownerId: owner2.id,
    },
  });
  const greenAgro = await prisma.company.create({
    data: {
      name: 'GreenValley Farms',
      industry: 'Agriculture',
      type: CompanyType.AGRICULTURE,
      currency: 'USD',
      ownerId: owner1.id,
    },
  });
  const urbanThreads = await prisma.company.create({
    data: {
      name: 'Urban Threads Boutique',
      industry: 'Retail / Clothing',
      type: CompanyType.RETAIL,
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
  // PERSONAL FINANCE
  // ==========================================
  console.log('💰 Creating Personal Finance Data...');
  await prisma.personalBudget.createMany({
    data: [
      {
        userId: owner1.id,
        category: 'General',
        amount: 3500,
        frequency: BudgetType.MONTHLY,
        startDate: daysAgo(30),
      },
      {
        userId: owner1.id,
        category: 'General',
        amount: 400,
        frequency: BudgetType.WEEKLY,
        startDate: daysAgo(7),
      },
    ],
  });

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
  // PROJECTS
  // ==========================================
  console.log('🏗️ Creating Projects & Updates...');
  const project1 = await prisma.project.create({
    data: {
      companyId: buildCo.id,
      name: 'Downtown Commercial Skyscraper',
      progress: 35.0,
    },
  });
  await prisma.project.create({
    data: {
      companyId: buildCo.id,
      name: 'Westside Residential Complex',
      progress: 78.5,
    },
  });
  await prisma.project.create({
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
        userId: pm1.id,
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
    ],
  });

  // ==========================================
  // MACHINERY
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
  await prisma.machinery.create({
    data: {
      companyId: buildCo.id,
      name: 'Liebherr LTM 1120 Crane',
      category: 'Lifting Equipment',
      status: MachineryStatus.MAINTENANCE,
      ownershipType: MachineryOwnership.RENTED,
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
    data: [{ machineryId: excavator.id, userId: operator.id, isHelper: false }],
  });

  // ==========================================
  // COMPANY FINANCE
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
  companyIncomesData.push({
    companyId: buildCo.id,
    registeredBy: owner1.id,
    amount: 150000,
    category: 'Client Milestone Payment',
    note: 'Milestone 2 payment',
    projectId: project1.id,
    date: daysAgo(20),
  });
  await prisma.companyExpense.createMany({ data: companyExpensesData });
  await prisma.companyIncome.createMany({ data: companyIncomesData });

  // ==========================================
  // EMPLOYEES
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
        companyId: urbanThreads.id,
        name: 'Retail Staff 1',
        employmentType: EmploymentType.PERMANENT,
        wage: 2500,
        nextPayDate: daysAgo(-5),
      },
    ],
  });

  // ==========================================
  // STORE INVENTORY
  // ==========================================
  console.log('📦 Creating Store Categories & Items...');

  // Create categories for BuildCo
  const catBuildCoGeneral = await prisma.storeCategory.create({
    data: { companyId: buildCo.id, name: 'General' },
  });
  const catBuildCoConsumable = await prisma.storeCategory.create({
    data: { companyId: buildCo.id, name: 'Consumables' },
  });
  const catBuildCoTools = await prisma.storeCategory.create({
    data: { companyId: buildCo.id, name: 'Tools' },
  });

  const cement = await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Portland Cement Bags (50kg)',
      categoryId: catBuildCoConsumable.id,
      quantity: 250,
      lowStockThreshold: 50,
      unit: 'bags',
    },
  });
  const rebar = await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Steel Rebar T12 (12m)',
      categoryId: catBuildCoConsumable.id,
      quantity: 18,
      lowStockThreshold: 30,
      unit: 'pieces',
    },
  });
  await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Bosch Industrial Jackhammer',
      categoryId: catBuildCoTools.id,
      quantity: 4,
      lowStockThreshold: 1,
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
    ],
  });

  // ==========================================
  // RETAIL DATA — Urban Threads
  // ==========================================
  console.log('🛍️ Creating Retail Customers, Suppliers & Sales...');

  const customer1 = await prisma.customer.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Alice Johnson',
      phone: '+1-555-0201',
      email: 'alice@example.com',
    },
  });
  const customer2 = await prisma.customer.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Michael Chen',
      phone: '+1-555-0202',
    },
  });
  const walkIn = await prisma.customer.create({
    data: { companyId: urbanThreads.id, name: 'Walk-in Customer' },
  });

  const supplier1 = await prisma.supplier.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Royal Textile Mills Ltd.',
      phone: '+1-555-0301',
      email: 'orders@royaltextile.com',
    },
  });
  const supplier2 = await prisma.supplier.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Premium Fabrics Co.',
      phone: '+1-555-0302',
    },
  });

  // Create categories for Urban Threads
  const catUrbanGeneral = await prisma.storeCategory.create({
    data: { companyId: urbanThreads.id, name: 'General' },
  });
  const catUrbanClothing = await prisma.storeCategory.create({
    data: { companyId: urbanThreads.id, name: 'Clothing' },
  });

  // Retail store items with prices
  const tShirt = await prisma.storeItem.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Cotton T-Shirt (White)',
      categoryId: catUrbanClothing.id,
      quantity: 85,
      lowStockThreshold: 20,
      sellingPrice: 24.99,
      costPrice: 12.5,
      unit: 'pcs',
    },
  });
  const jeans = await prisma.storeItem.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Denim Jeans (Blue)',
      categoryId: catUrbanClothing.id,
      quantity: 42,
      lowStockThreshold: 15,
      sellingPrice: 59.99,
      costPrice: 28.0,
      unit: 'pcs',
    },
  });
  const jacket = await prisma.storeItem.create({
    data: {
      companyId: urbanThreads.id,
      name: 'Winter Jacket (Black)',
      categoryId: catUrbanClothing.id,
      quantity: 18,
      lowStockThreshold: 10,
      sellingPrice: 129.99,
      costPrice: 65.0,
      unit: 'pcs',
    },
  });

  // Sales transactions
  await prisma.sale.create({
    data: {
      companyId: urbanThreads.id,
      customerId: customer1.id,
      registeredBy: salesRep.id,
      totalAmount: 204.97,
      discount: 10,
      note: 'Regular customer',
      date: daysAgo(3),
      items: {
        create: [
          { itemId: tShirt.id, quantity: 3, unitPrice: 24.99, total: 74.97 },
          { itemId: jeans.id, quantity: 2, unitPrice: 59.99, total: 119.98 },
        ],
      },
    },
  });

  await prisma.sale.create({
    data: {
      companyId: urbanThreads.id,
      customerId: customer2.id,
      registeredBy: salesRep.id,
      totalAmount: 389.97,
      discount: 0,
      date: daysAgo(7),
      items: {
        create: [
          { itemId: jacket.id, quantity: 3, unitPrice: 129.99, total: 389.97 },
        ],
      },
    },
  });

  await prisma.sale.create({
    data: {
      companyId: urbanThreads.id,
      customerId: walkIn.id,
      registeredBy: salesRep.id,
      totalAmount: 74.97,
      discount: 0,
      note: 'Walk-in',
      date: daysAgo(1),
      items: {
        create: [
          { itemId: tShirt.id, quantity: 3, unitPrice: 24.99, total: 74.97 },
        ],
      },
    },
  });

  // Purchases (restocking)
  await prisma.purchase.create({
    data: {
      companyId: urbanThreads.id,
      supplierId: supplier1.id,
      registeredBy: storekeeper.id,
      totalAmount: 3750,
      note: 'Monthly restock',
      date: daysAgo(20),
      items: {
        create: [
          { itemId: tShirt.id, quantity: 100, unitCost: 12.5, total: 1250 },
          { itemId: jeans.id, quantity: 50, unitCost: 28.0, total: 1400 },
          { itemId: jacket.id, quantity: 20, unitCost: 55.0, total: 1100 },
        ],
      },
    },
  });

  await prisma.purchase.create({
    data: {
      companyId: urbanThreads.id,
      supplierId: supplier2.id,
      registeredBy: storekeeper.id,
      totalAmount: 650,
      note: 'Premium jacket restock',
      date: daysAgo(10),
      items: {
        create: [
          { itemId: jacket.id, quantity: 10, unitCost: 65.0, total: 650 },
        ],
      },
    },
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
        userId: pm1.id,
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
