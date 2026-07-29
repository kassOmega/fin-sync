import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  const steps = [
    // 1. Enums (safe — uses IF NOT EXISTS pattern via DO block)
    `DO $$ BEGIN CREATE TYPE finsync."ProjectStatus" AS ENUM ('PLANNED','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE finsync."MachineryStatus" AS ENUM ('AVAILABLE','IN_USE','UNDER_MAINTENANCE','OUT_OF_SERVICE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE finsync."MachineryType" AS ENUM ('EXCAVATOR','BULLDOZER','DUMPER_TRUCK','TRACTOR','GENERATOR','VEHICLE','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE finsync."EmploymentType" AS ENUM ('FULL_TIME','PART_TIME','CONTRACT','DAILY_LABORER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE finsync."AttendanceStatus" AS ENUM ('PRESENT','ABSENT','LATE','HALF_DAY','ON_LEAVE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE finsync."TimesheetStatus" AS ENUM ('DRAFT','SUBMITTED','APPROVED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE finsync."PayrollStatus" AS ENUM ('DRAFT','APPROVED','PAID','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

    // 2. Employees table
    `CREATE TABLE IF NOT EXISTS finsync.employees (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES finsync."Company"(id) ON DELETE CASCADE,
      user_id INTEGER UNIQUE REFERENCES finsync."User"(id) ON DELETE SET NULL,
      employee_code VARCHAR NOT NULL,
      first_name VARCHAR NOT NULL,
      last_name VARCHAR NOT NULL,
      email VARCHAR,
      phone VARCHAR,
      designation VARCHAR NOT NULL,
      employment_type finsync."EmploymentType" DEFAULT 'FULL_TIME',
      base_salary DECIMAL(12,2),
      hourly_rate DECIMAL(10,2),
      daily_rate DECIMAL(10,2),
      is_active BOOLEAN DEFAULT true,
      joined_date TIMESTAMP DEFAULT NOW(),
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_emp_company_code UNIQUE (company_id, employee_code)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_employees_company ON finsync.employees(company_id)`,

    // 3. Projects table – migrate/add columns
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS code VARCHAR`,
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS description TEXT`,
    `DO $$ BEGIN ALTER TABLE finsync."Project" ADD COLUMN status finsync."ProjectStatus" DEFAULT 'IN_PROGRESS'; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2)`,
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS start_date TIMESTAMP`,
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS end_date TIMESTAMP`,
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`,
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES finsync.employees(id) ON DELETE SET NULL`,
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT NOW()`,

    // 4. ProjectAssignment
    `CREATE TABLE IF NOT EXISTS finsync."ProjectAssignment" (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES finsync."Project"(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES finsync."User"(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_proj_user UNIQUE (project_id, user_id)
    )`,

    // 5. ProjectMember
    `CREATE TABLE IF NOT EXISTS finsync.project_members (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES finsync.projects(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES finsync.employees(id) ON DELETE CASCADE,
      role_on_site VARCHAR,
      custom_rate DECIMAL(10,2),
      assigned_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_proj_emp UNIQUE (project_id, employee_id)
    )`,

    // 6. ProjectTask
    `CREATE TABLE IF NOT EXISTS finsync.project_tasks (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES finsync.projects(id) ON DELETE CASCADE,
      title VARCHAR NOT NULL,
      description TEXT,
      status VARCHAR DEFAULT 'TODO',
      due_date TIMESTAMP,
      "created_at" TIMESTAMP DEFAULT NOW()
    )`,

    // 7. Attendance
    `CREATE TABLE IF NOT EXISTS finsync.attendances (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES finsync."Company"(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES finsync.employees(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES finsync.projects(id) ON DELETE SET NULL,
      date DATE NOT NULL,
      check_in TIMESTAMP,
      check_out TIMESTAMP,
      status finsync."AttendanceStatus" DEFAULT 'PRESENT',
      remarks VARCHAR,
      "created_at" TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_emp_date UNIQUE (employee_id, date)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_att_company_date ON finsync.attendances(company_id, date)`,

    // 8. Timesheets
    `CREATE TABLE IF NOT EXISTS finsync.timesheets (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES finsync."Company"(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES finsync.employees(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES finsync.projects(id) ON DELETE SET NULL,
      machinery_id INTEGER REFERENCES finsync.machineries(id) ON DELETE SET NULL,
      date DATE NOT NULL,
      regular_hours DECIMAL(4,2) DEFAULT 8.0,
      overtime_hours DECIMAL(4,2) DEFAULT 0.0,
      description TEXT,
      status finsync."TimesheetStatus" DEFAULT 'DRAFT',
      approved_by_id INTEGER,
      approved_at TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_ts_company_emp_date ON finsync.timesheets(company_id, employee_id, date)`,

    // 9. Payrolls
    `CREATE TABLE IF NOT EXISTS finsync.payrolls (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES finsync."Company"(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES finsync.projects(id) ON DELETE SET NULL,
      title VARCHAR NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_amount DECIMAL(12,2) DEFAULT 0,
      status finsync."PayrollStatus" DEFAULT 'DRAFT',
      expense_id INTEGER UNIQUE REFERENCES finsync."CompanyExpense"(id) ON DELETE SET NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // 10. PayrollItems
    `CREATE TABLE IF NOT EXISTS finsync.payroll_items (
      id SERIAL PRIMARY KEY,
      payroll_id INTEGER NOT NULL REFERENCES finsync.payrolls(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES finsync.employees(id) ON DELETE CASCADE,
      base_pay DECIMAL(10,2) NOT NULL,
      overtime_pay DECIMAL(10,2) DEFAULT 0,
      deductions DECIMAL(10,2) DEFAULT 0,
      net_pay DECIMAL(10,2) NOT NULL
    )`,

    // 11. Migrate machineries – add new columns
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS code VARCHAR`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS make VARCHAR`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS model VARCHAR`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS plate_number VARCHAR`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS serial_number VARCHAR`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS total_hours_run DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS current_mileage DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2)`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10,2)`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS operator_id INTEGER REFERENCES finsync.employees(id) ON DELETE SET NULL`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT NOW()`,
    `DO $$ BEGIN ALTER TABLE finsync."Machinery" ADD COLUMN type finsync."MachineryType" DEFAULT 'OTHER'; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE finsync."Machinery" ALTER COLUMN status TYPE finsync."MachineryStatus" USING CASE WHEN status::text = 'IDLE' THEN 'AVAILABLE'::finsync."MachineryStatus" WHEN status::text = 'WORKING' THEN 'IN_USE'::finsync."MachineryStatus" WHEN status::text = 'MAINTENANCE' THEN 'UNDER_MAINTENANCE'::finsync."MachineryStatus" ELSE 'AVAILABLE'::finsync."MachineryStatus" END; EXCEPTION WHEN undefined_object THEN NULL; END $$`,
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,

    // 12. MachineryLog
    `CREATE TABLE IF NOT EXISTS finsync.machinery_logs (
      id SERIAL PRIMARY KEY,
      machinery_id INTEGER NOT NULL REFERENCES finsync.machineries(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES finsync.projects(id) ON DELETE SET NULL,
      operator_id INTEGER REFERENCES finsync.employees(id) ON DELETE SET NULL,
      start_meter DECIMAL(10,2),
      end_meter DECIMAL(10,2),
      hours_logged DECIMAL(8,2) DEFAULT 0,
      fuel_liters DECIMAL(8,2),
      fuel_cost DECIMAL(10,2),
      expense_id INTEGER UNIQUE REFERENCES finsync."CompanyExpense"(id) ON DELETE SET NULL,
      date TIMESTAMP DEFAULT NOW(),
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // 13. MachineryMaintenance
    `CREATE TABLE IF NOT EXISTS finsync.machinery_maintenances (
      id SERIAL PRIMARY KEY,
      machinery_id INTEGER NOT NULL REFERENCES finsync.machineries(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      total_cost DECIMAL(10,2) NOT NULL,
      performed_by_id INTEGER REFERENCES finsync.employees(id) ON DELETE SET NULL,
      expense_id INTEGER UNIQUE REFERENCES finsync."CompanyExpense"(id) ON DELETE SET NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )`,

    // 14. CompanyExpense – add new nullable FK columns for integration
    `ALTER TABLE finsync."CompanyExpense" ADD COLUMN IF NOT EXISTS payroll_expense_id INTEGER`,
    `ALTER TABLE finsync."CompanyExpense" ADD COLUMN IF NOT EXISTS machinery_log_expense_id INTEGER`,
    `ALTER TABLE finsync."CompanyExpense" ADD COLUMN IF NOT EXISTS maintenance_expense_id INTEGER`,

    // 15. StoreRequest – add projectId
    `ALTER TABLE finsync."StoreRequest" ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES finsync.projects(id) ON DELETE SET NULL`,

    // 16. Rename old tables if needed (machinery -> machineries already done)
  ];

  let ok = 0;
  let fail = 0;

  for (const sql of steps) {
    try {
      await prisma.$executeRawUnsafe(sql);
      ok++;
    } catch (e: any) {
      // Skip "already exists" and "duplicate column" errors
      if (
        e.message?.includes('already exists') ||
        e.message?.includes('duplicate_column') ||
        e.message?.includes('duplicate_object') ||
        e.message?.includes('multiple primary keys')
      ) {
        ok++;
      } else {
        console.error(`  ❌ FAILED: ${e.message?.split('\n')[0]}`);
        fail++;
      }
    }
  }

  await prisma.$disconnect();
  console.log(`\n✅ Migration complete: ${ok} steps succeeded, ${fail} failed`);
  if (fail) process.exit(1);
}

main();
