-- Add weekly pay rate to employees (monthly = baseSalary, weekly = daily × 6)
ALTER TABLE finsync.employees ADD COLUMN IF NOT EXISTS "weeklyRate" DECIMAL(10, 2);
