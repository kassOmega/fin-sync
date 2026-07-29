import { PrismaClient } from '@prisma/client';
import { seedMeasuringUnits } from './00-measuring-units';
import { seedPermissions } from './00-permissions';
import { seedUsers } from './01-users';
import { seedCompanies } from './02-companies';
import { seedPersonalFinance } from './03-personal-finance';
import { seedProjects } from './04-projects';
import { seedMachinery } from './05-machinery';
import { seedCompanyFinance } from './06-company-finance';
import { seedEmployees } from './07-employees';
import { seedStoreInventory } from './08-store-inventory';
import { seedRetail } from './09-retail';
import { seedNotifications } from './10-notifications';
import { seedRoles } from './11-roles';
import { createContext, disconnect, getPrisma } from './utils';

async function clearDatabase(prisma: PrismaClient): Promise<void> {
  console.log('🧹 Clearing existing database records...');

  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  try {
    const tables = [
      '"CompanyRolePermission"',
      '"CompanyRole"',
      '"Permission"',
      '"StoreRequest"',
      '"StoreTransaction"',
      '"StoreItem"',
      '"StoreCategory"',
      '"SaleItem"',
      '"Sale"',
      '"Customer"',
      '"PurchaseItem"',
      '"Purchase"',
      '"Supplier"',
      '"Notification"',
      '"MachineryLog"',
      '"MachineryMaintenance"',
      '"Machinery"',
      '"ProjectUpdate"',
      '"ProjectAssignment"',
      '"ProjectTask"',
      '"ProjectMember"',
      '"Project"',
      '"PayrollItem"',
      '"Payroll"',
      '"Timesheet"',
      '"Attendance"',
      '"Employee"',
      '"CompanyExpense"',
      '"CompanyIncome"',
      '"AccountTransfer"',
      '"PersonalExpense"',
      '"PersonalIncome"',
      '"PersonalSaving"',
      '"PersonalBudget"',
      '"PersonalAccount"',
      '"CompanyMember"',
      '"Company"',
      '"User"',
      '"MeasuringUnit"',
    ];
    for (const t of tables) {
      try {
        await client.query(`DELETE FROM finsync.${t}`);
      } catch {}
    }
  } finally {
    client.release();
    await pool.end();
  }
}

export async function seedAll(): Promise<void> {
  const prisma = getPrisma();
  const ctx = createContext();

  try {
    await clearDatabase(prisma);

    await seedPermissions(prisma);
    await seedMeasuringUnits(prisma, ctx);
    await seedUsers(prisma, ctx);
    await seedCompanies(prisma, ctx);
    await seedPersonalFinance(prisma, ctx);
    await seedProjects(prisma, ctx);
    await seedMachinery(prisma, ctx);
    await seedCompanyFinance(prisma, ctx);
    await seedEmployees(prisma, ctx);
    await seedStoreInventory(prisma, ctx);
    await seedRetail(prisma, ctx);
    await seedNotifications(prisma, ctx);
    await seedRoles(prisma, ctx);

    console.log('\n✅ All seeds inserted successfully!\n');
    console.log('📊 SEED SUMMARY:');
    console.log(
      `   Measuring Units: ${Object.keys(ctx.measuringUnits).length}`,
    );
    console.log(`   Users: ${Object.keys(ctx.users).length}`);
    console.log(`   Companies: ${Object.keys(ctx.companies).length}`);
    console.log(
      `   Personal Accounts: ${Object.keys(ctx.personalAccounts).length}`,
    );
    console.log(`   Projects: ${Object.keys(ctx.projects).length}`);
    console.log(`   Machinery: ${Object.keys(ctx.machinery).length}`);
    console.log(
      `   Store Categories: ${Object.keys(ctx.storeCategories).length}`,
    );
    console.log(`   Store Items: ${Object.keys(ctx.storeItems).length}`);
    console.log(`   Customers: ${Object.keys(ctx.customers).length}`);
    console.log(`   Suppliers: ${Object.keys(ctx.suppliers).length}`);
    console.log(`   Employees: ${Object.keys(ctx.employees).length}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

if (require.main === module) {
  seedAll()
    .catch((e) => {
      console.error('❌ Seed script failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await disconnect();
    });
}
