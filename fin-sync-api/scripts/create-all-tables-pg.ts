import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  const ok = async (sql: string, label: string) => {
    try {
      await client.query(sql);
      console.log(`  ✅ ${label}`);
    } catch (e: any) {
      console.error(`  ❌ ${label}: ${e.message?.split('\n')[0]}`);
    }
  };

  // === Phase 1: Update existing enums ===
  console.log('\n--- Updating enums ---');
  // EmploymentType: add new values to existing enum
  for (const val of ['FULL_TIME', 'PART_TIME', 'CONTRACT']) {
    await ok(
      `ALTER TYPE finsync."EmploymentType" ADD VALUE IF NOT EXISTS '${val}'`,
      `EmploymentType.${val}`,
    );
  }
  await ok(
    `CREATE TYPE IF NOT EXISTS finsync."ProjectStatus" AS ENUM ('PLANNED','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED')`,
    'ProjectStatus',
  );
  await ok(
    `CREATE TYPE IF NOT EXISTS finsync."MachineryStatus" AS ENUM ('AVAILABLE','IN_USE','UNDER_MAINTENANCE','OUT_OF_SERVICE')`,
    'MachineryStatus',
  );
  await ok(
    `CREATE TYPE IF NOT EXISTS finsync."MachineryType" AS ENUM ('EXCAVATOR','BULLDOZER','DUMPER_TRUCK','TRACTOR','GENERATOR','VEHICLE','OTHER')`,
    'MachineryType',
  );
  await ok(
    `CREATE TYPE IF NOT EXISTS finsync."AttendanceStatus" AS ENUM ('PRESENT','ABSENT','LATE','HALF_DAY','ON_LEAVE')`,
    'AttendanceStatus',
  );
  await ok(
    `CREATE TYPE IF NOT EXISTS finsync."TimesheetStatus" AS ENUM ('DRAFT','SUBMITTED','APPROVED','REJECTED')`,
    'TimesheetStatus',
  );
  await ok(
    `CREATE TYPE IF NOT EXISTS finsync."PayrollStatus" AS ENUM ('DRAFT','APPROVED','PAID','CANCELLED')`,
    'PayrollStatus',
  );

  // === Phase 2: Create new tables ===
  console.log('\n--- Creating tables ---');
  await ok(
    `CREATE TABLE IF NOT EXISTS finsync.employees (
    id SERIAL PRIMARY KEY, company_id INT NOT NULL REFERENCES finsync."Company"(id) ON DELETE CASCADE,
    user_id INT UNIQUE REFERENCES finsync."User"(id) ON DELETE SET NULL,
    employee_code VARCHAR NOT NULL, first_name VARCHAR NOT NULL, last_name VARCHAR NOT NULL,
    email VARCHAR, phone VARCHAR, designation VARCHAR NOT NULL,
    employment_type VARCHAR DEFAULT 'FULL_TIME',
    base_salary DECIMAL(12,2), hourly_rate DECIMAL(10,2), daily_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true, joined_date TIMESTAMP DEFAULT NOW(),
    "created_at" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_emp_cmp_code UNIQUE (company_id, employee_code)
  )`,
    'employees',
  );

  // Projects – add columns to existing table
  await ok(
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS code VARCHAR`,
    'Project.code',
  );
  await ok(
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS description TEXT`,
    'Project.description',
  );
  await ok(
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'IN_PROGRESS'`,
    'Project.status',
  );
  await ok(
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2)`,
    'Project.budget',
  );
  await ok(
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS start_date TIMESTAMP`,
    'Project.start_date',
  );
  await ok(
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS end_date TIMESTAMP`,
    'Project.end_date',
  );
  await ok(
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`,
    'Project.completed_at',
  );
  await ok(
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS manager_id INT`,
    'Project.manager_id',
  );
  await ok(
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
    'Project.created_at',
  );
  await ok(
    `ALTER TABLE finsync."Project" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT NOW()`,
    'Project.updated_at',
  );

  await ok(
    `CREATE TABLE IF NOT EXISTS finsync."ProjectAssignment" (
    id SERIAL PRIMARY KEY, project_id INT NOT NULL REFERENCES finsync."Project"(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES finsync."User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW(), CONSTRAINT uq_pa_puid UNIQUE (project_id, user_id)
  )`,
    'ProjectAssignment',
  );

  await ok(
    `CREATE TABLE IF NOT EXISTS finsync.project_members (
    id SERIAL PRIMARY KEY, project_id INT NOT NULL REFERENCES finsync."Project"(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES finsync.employees(id) ON DELETE CASCADE,
    role_on_site VARCHAR, custom_rate DECIMAL(10,2), assigned_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_pm_pe UNIQUE (project_id, employee_id)
  )`,
    'project_members',
  );

  await ok(
    `CREATE TABLE IF NOT EXISTS finsync.project_tasks (
    id SERIAL PRIMARY KEY, project_id INT NOT NULL REFERENCES finsync."Project"(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL, description TEXT, status VARCHAR DEFAULT 'TODO',
    due_date TIMESTAMP, "created_at" TIMESTAMP DEFAULT NOW()
  )`,
    'project_tasks',
  );

  await ok(
    `CREATE TABLE IF NOT EXISTS finsync.attendances (
    id SERIAL PRIMARY KEY, company_id INT NOT NULL REFERENCES finsync."Company"(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES finsync.employees(id) ON DELETE CASCADE,
    project_id INT REFERENCES finsync."Project"(id) ON DELETE SET NULL,
    date DATE NOT NULL, check_in TIMESTAMP, check_out TIMESTAMP,
    status VARCHAR DEFAULT 'PRESENT', remarks VARCHAR,
    "created_at" TIMESTAMP DEFAULT NOW(), CONSTRAINT uq_att_ed UNIQUE (employee_id, date)
  )`,
    'attendances',
  );

  await ok(
    `CREATE TABLE IF NOT EXISTS finsync.timesheets (
    id SERIAL PRIMARY KEY, company_id INT NOT NULL REFERENCES finsync."Company"(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES finsync.employees(id) ON DELETE CASCADE,
    project_id INT REFERENCES finsync."Project"(id) ON DELETE SET NULL,
    machinery_id INT REFERENCES finsync."Machinery"(id) ON DELETE SET NULL,
    date DATE NOT NULL, regular_hours DECIMAL(4,2) DEFAULT 8.0,
    overtime_hours DECIMAL(4,2) DEFAULT 0.0, description TEXT,
    status VARCHAR DEFAULT 'DRAFT', approved_by_id INT, approved_at TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW()
  )`,
    'timesheets',
  );

  await ok(
    `CREATE TABLE IF NOT EXISTS finsync.payrolls (
    id SERIAL PRIMARY KEY, company_id INT NOT NULL REFERENCES finsync."Company"(id) ON DELETE CASCADE,
    project_id INT REFERENCES finsync."Project"(id) ON DELETE SET NULL,
    title VARCHAR NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL,
    total_amount DECIMAL(12,2) DEFAULT 0, status VARCHAR DEFAULT 'DRAFT',
    expense_id INT UNIQUE REFERENCES finsync."CompanyExpense"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
    'payrolls',
  );

  await ok(
    `CREATE TABLE IF NOT EXISTS finsync.payroll_items (
    id SERIAL PRIMARY KEY, payroll_id INT NOT NULL REFERENCES finsync.payrolls(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES finsync.employees(id) ON DELETE CASCADE,
    base_pay DECIMAL(10,2) NOT NULL, overtime_pay DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0, net_pay DECIMAL(10,2) NOT NULL
  )`,
    'payroll_items',
  );

  // Machinery – add columns to existing table
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS code VARCHAR`,
    'Machinery.code',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS make VARCHAR`,
    'Machinery.make',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS model VARCHAR`,
    'Machinery.model',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS plate_number VARCHAR`,
    'Machinery.plate_number',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS serial_number VARCHAR`,
    'Machinery.serial_number',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS total_hours_run DECIMAL(10,2) DEFAULT 0`,
    'Machinery.total_hours_run',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS current_mileage DECIMAL(10,2) DEFAULT 0`,
    'Machinery.current_mileage',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2)`,
    'Machinery.hourly_rate',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10,2)`,
    'Machinery.daily_rate',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS operator_id INT`,
    'Machinery.operator_id',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'OTHER'`,
    'Machinery.type',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT NOW()`,
    'Machinery.updated_at',
  );
  await ok(
    `ALTER TABLE finsync."Machinery" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
    'Machinery.created_at',
  );

  await ok(
    `CREATE TABLE IF NOT EXISTS finsync.machinery_logs (
    id SERIAL PRIMARY KEY, machinery_id INT NOT NULL REFERENCES finsync."Machinery"(id) ON DELETE CASCADE,
    project_id INT REFERENCES finsync."Project"(id) ON DELETE SET NULL,
    operator_id INT REFERENCES finsync.employees(id) ON DELETE SET NULL,
    start_meter DECIMAL(10,2), end_meter DECIMAL(10,2), hours_logged DECIMAL(8,2) DEFAULT 0,
    fuel_liters DECIMAL(8,2), fuel_cost DECIMAL(10,2),
    expense_id INT UNIQUE REFERENCES finsync."CompanyExpense"(id) ON DELETE SET NULL,
    date TIMESTAMP DEFAULT NOW(), "createdAt" TIMESTAMP DEFAULT NOW()
  )`,
    'machinery_logs',
  );

  await ok(
    `CREATE TABLE IF NOT EXISTS finsync.machinery_maintenances (
    id SERIAL PRIMARY KEY, machinery_id INT NOT NULL REFERENCES finsync."Machinery"(id) ON DELETE CASCADE,
    description TEXT NOT NULL, total_cost DECIMAL(10,2) NOT NULL,
    performed_by_id INT REFERENCES finsync.employees(id) ON DELETE SET NULL,
    expense_id INT UNIQUE REFERENCES finsync."CompanyExpense"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
  )`,
    'machinery_maintenances',
  );

  // CompanyExpense integration columns
  await ok(
    `ALTER TABLE finsync."CompanyExpense" ADD COLUMN IF NOT EXISTS payroll_expense_id INT`,
    'CompanyExpense.payroll_expense_id',
  );
  await ok(
    `ALTER TABLE finsync."CompanyExpense" ADD COLUMN IF NOT EXISTS machinery_log_expense_id INT`,
    'CompanyExpense.machinery_log_expense_id',
  );
  await ok(
    `ALTER TABLE finsync."CompanyExpense" ADD COLUMN IF NOT EXISTS maintenance_expense_id INT`,
    'CompanyExpense.maintenance_expense_id',
  );
  await ok(
    `ALTER TABLE finsync."StoreRequest" ADD COLUMN IF NOT EXISTS project_id INT`,
    'StoreRequest.project_id',
  );

  // Migrate existing machinery runningHours → total_hours_run
  await ok(
    `UPDATE finsync."Machinery" SET total_hours_run = COALESCE("runningHours", 0) WHERE total_hours_run = 0 AND "runningHours" IS NOT NULL`,
    'migrate runningHours',
  );

  // Indexes
  await ok(
    `CREATE INDEX IF NOT EXISTS idx_emp_company ON finsync.employees(company_id)`,
    'idx_emp_company',
  );
  await ok(
    `CREATE INDEX IF NOT EXISTS idx_att_company_date ON finsync.attendances(company_id, date)`,
    'idx_att_company_date',
  );
  await ok(
    `CREATE INDEX IF NOT EXISTS idx_ts_company_emp_date ON finsync.timesheets(company_id, employee_id, date)`,
    'idx_ts',
  );

  client.release();
  await pool.end();
  console.log('\n✅ Migration complete!');
}

main();
