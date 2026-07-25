import { PrismaPg } from '@prisma/adapter-pg';
import {
  BudgetType,
  EmploymentType,
  ItemCategory,
  MachineryStatus,
  PrismaClient,
  StoreTxType,
  SystemRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { Pool } from 'pg';

// 1. Initialize Postgres Pool & Driver Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Pass Adapter to PrismaClient
const prisma = new PrismaClient({ adapter });

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

  const foreman = await prisma.user.create({
    data: {
      name: 'Marcus Brody',
      email: 'marcus.foreman@finsync.com',
      password: SystemRole.Foreman ? SystemRole.Foreman : commonPassword,
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
        startDate: new Date('2026-07-01'),
        carriedOverAmount: 120,
      },
      {
        userId: owner1.id,
        type: BudgetType.WEEKLY,
        amount: 400,
        startDate: new Date('2026-07-20'),
      },
    ],
  });

  await prisma.personalExpense.createMany({
    data: [
      {
        userId: owner1.id,
        amount: 85.5,
        category: 'Dining',
        note: 'Dinner with client',
        isCategorized: true,
        date: new Date('2026-07-21'),
      },
      {
        userId: owner1.id,
        amount: 45.0,
        category: 'Fuel',
        note: 'EcoSport Gas Refill',
        isCategorized: true,
        date: new Date('2026-07-23'),
      },
      {
        userId: owner1.id,
        amount: 150.0,
        note: 'ATM withdrawal - needs breakdown',
        isCategorized: false,
        date: new Date('2026-07-24'),
      },
    ],
  });

  await prisma.personalSaving.createMany({
    data: [
      {
        userId: owner1.id,
        targetAmount: 15000,
        currentAmount: 8400,
        thresholdAmount: 1000,
        frequency: BudgetType.MONTHLY,
        startDate: new Date('2026-01-01'),
      },
      {
        userId: owner1.id,
        targetAmount: 3000,
        currentAmount: 2100,
        thresholdAmount: 300,
        frequency: BudgetType.WEEKLY,
        startDate: new Date('2026-05-01'),
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

  await prisma.projectUpdate.createMany({
    data: [
      {
        projectId: project1.id,
        userId: pm.id,
        note: 'Foundation pouring completed ahead of schedule.',
        newProgress: 25.0,
        date: new Date('2026-06-15'),
      },
      {
        projectId: project1.id,
        userId: foreman.id,
        note: 'Steel framing structure for levels 1-3 erected.',
        newProgress: 35.0,
        date: new Date('2026-07-18'),
      },
      {
        projectId: project2.id,
        userId: pm.id,
        note: 'Interior drywalls and electrical rough-ins verified.',
        newProgress: 78.5,
        date: new Date('2026-07-22'),
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
      runningHours: 1240.5,
      lastMaintenanceHours: 1100.0,
    },
  });

  const crane = await prisma.machinery.create({
    data: {
      companyId: buildCo.id,
      name: 'Liebherr LTM 1120 Crane',
      category: 'Lifting Equipment',
      status: MachineryStatus.MAINTENANCE,
      runningHours: 850.0,
      lastMaintenanceHours: 850.0,
    },
  });

  const tractor = await prisma.machinery.create({
    data: {
      companyId: greenAgro.id,
      name: 'John Deere 6R Tractor',
      category: 'Farming Equipment',
      status: MachineryStatus.IDLE,
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
  // COMPANY FINANCE (Income & Expenses)
  // ==========================================
  console.log('💳 Creating Company Financial Records...');
  await prisma.companyIncome.createMany({
    data: [
      {
        companyId: buildCo.id,
        registeredBy: owner1.id,
        amount: 150000,
        category: 'Client Milestone Payment',
        note: 'Milestone 2 payment for Downtown Skyscraper',
        projectId: project1.id,
        date: new Date('2026-07-05'),
      },
      {
        companyId: buildCo.id,
        registeredBy: cashier.id,
        amount: 25000,
        category: 'Equipment Rental Income',
        note: 'Subcontractor rented crane for 3 days',
        machineryId: crane.id,
        date: new Date('2026-07-12'),
      },
      {
        companyId: horizonLogistics.id,
        registeredBy: owner2.id,
        amount: 42000,
        category: 'Freight Shipment Fee',
        note: 'Cross-border transport batch #882',
        date: new Date('2026-07-20'),
      },
    ],
  });

  await prisma.companyExpense.createMany({
    data: [
      {
        companyId: buildCo.id,
        registeredBy: cashier.id,
        amount: 3200,
        category: 'Fuel',
        note: '500L Diesel for Excavator & site generators',
        machineryId: excavator.id,
        projectId: project1.id,
        date: new Date('2026-07-15'),
      },
      {
        companyId: buildCo.id,
        registeredBy: pm.id,
        amount: 12500,
        category: 'Subcontractor Fees',
        note: 'Electrical wiring phase 1',
        projectId: project2.id,
        date: new Date('2026-07-19'),
      },
      {
        companyId: buildCo.id,
        registeredBy: cashier.id,
        amount: 1800,
        category: 'Machinery Service',
        note: 'Hydraulic line replacement',
        machineryId: crane.id,
        date: new Date('2026-07-22'),
      },
    ],
  });

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
        wage: 4200, // Monthly salary
        nextPayDate: new Date('2026-07-31'),
      },
      {
        companyId: buildCo.id,
        name: "Liam O'Connor",
        employmentType: EmploymentType.DAILY_LABORER,
        wage: 65, // Daily rate
        nextPayDate: new Date('2026-07-26'),
      },
      {
        companyId: buildCo.id,
        name: 'Samira Patel',
        employmentType: EmploymentType.DAILY_LABORER,
        wage: 70,
        nextPayDate: new Date('2026-07-26'),
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
    },
  });

  const rebar = await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Steel Rebar T12 (12m)',
      category: ItemCategory.CONSUMABLE,
      quantity: 18, // Below low stock threshold!
      lowStockThreshold: 30,
    },
  });

  const jackhammer = await prisma.storeItem.create({
    data: {
      companyId: buildCo.id,
      name: 'Bosch Industrial Jackhammer',
      category: ItemCategory.TOOL,
      quantity: 4,
      lowStockThreshold: 1,
    },
  });

  // Store Transactions
  await prisma.storeTransaction.createMany({
    data: [
      {
        itemId: cement.id,
        companyId: buildCo.id,
        type: StoreTxType.RESTOCK,
        quantity: 300,
        status: 'APPROVED',
        date: new Date('2026-07-01'),
      },
      {
        itemId: cement.id,
        companyId: buildCo.id,
        type: StoreTxType.ISSUE,
        quantity: 50,
        issuedToUserId: foreman.id,
        status: 'APPROVED',
        date: new Date('2026-07-10'),
      },
      {
        itemId: jackhammer.id,
        companyId: buildCo.id,
        type: StoreTxType.ISSUE,
        quantity: 1,
        issuedToUserId: operator.id,
        status: 'APPROVED',
        date: new Date('2026-07-20'),
      },
    ],
  });

  // Store Requests
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

  console.log('✅ Multiple relational seeds inserted successfully!');
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
