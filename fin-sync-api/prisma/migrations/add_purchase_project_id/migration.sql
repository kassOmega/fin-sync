ALTER TABLE finsync."Purchase" ADD COLUMN IF NOT EXISTS "project_id" INTEGER REFERENCES finsync."Project"(id) ON DELETE SET NULL;
