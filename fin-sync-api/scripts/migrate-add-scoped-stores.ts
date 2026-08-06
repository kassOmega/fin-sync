import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { URL } from 'url';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');

const url = new URL(connectionString);
const schema = url.searchParams.get('schema') || 'finsync';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  options: `-c search_path=${schema}`,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Running migration: add_scoped_stores...');

  // Create Store table (no FK to projects to avoid naming issues)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS finsync."Store" (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company_id INTEGER NOT NULL REFERENCES finsync."Company"(id) ON DELETE CASCADE,
      project_id INTEGER,
      storekeeper_id INTEGER REFERENCES finsync."User"(id) ON DELETE SET NULL,
      description TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ Store table');

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Store_companyId_name_key" ON finsync."Store"(company_id, name)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Store_companyId_idx" ON finsync."Store"(company_id)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Store_projectId_idx" ON finsync."Store"(project_id)`);

  // Create StoreTransfer table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS finsync."StoreTransfer" (
      id SERIAL PRIMARY KEY,
      from_store_id INTEGER NOT NULL REFERENCES finsync."Store"(id),
      to_store_id INTEGER NOT NULL REFERENCES finsync."Store"(id),
      item_id INTEGER NOT NULL REFERENCES finsync."StoreItem"(id),
      quantity DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      requested_by_id INTEGER NOT NULL REFERENCES finsync."User"(id),
      approved_by_id INTEGER REFERENCES finsync."User"(id),
      completed_at TIMESTAMP(3),
      note TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ StoreTransfer table');

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StoreTransfer_fromStoreId_idx" ON finsync."StoreTransfer"(from_store_id)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StoreTransfer_toStoreId_idx" ON finsync."StoreTransfer"(to_store_id)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StoreTransfer_status_idx" ON finsync."StoreTransfer"(status)`);

  // Add columns to existing tables
  await prisma.$executeRawUnsafe(`ALTER TABLE finsync."StoreItem" ADD COLUMN IF NOT EXISTS store_id INTEGER`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StoreItem_storeId_idx" ON finsync."StoreItem"(store_id)`);
  console.log('  ✓ StoreItem.store_id');

  await prisma.$executeRawUnsafe(`ALTER TABLE finsync."StoreTransaction" ADD COLUMN IF NOT EXISTS store_id INTEGER`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StoreTransaction_storeId_idx" ON finsync."StoreTransaction"(store_id)`);
  console.log('  ✓ StoreTransaction.store_id');

  await prisma.$executeRawUnsafe(`ALTER TABLE finsync."StoreRequest" ADD COLUMN IF NOT EXISTS store_id INTEGER`);
  console.log('  ✓ StoreRequest.store_id');

  await prisma.$executeRawUnsafe(`ALTER TABLE finsync."StoreCategory" ADD COLUMN IF NOT EXISTS store_id INTEGER`);
  console.log('  ✓ StoreCategory.store_id');

  // Create default stores for existing companies and backfill storeId
  const companies = await prisma.$queryRawUnsafe<{ id: number; name: string }[]>(
    `SELECT id, name FROM finsync."Company"`
  );
  for (const c of companies) {
    const existing = await prisma.$queryRawUnsafe<{ id: number }[]>(
      `SELECT id FROM finsync."Store" WHERE company_id = ${c.id} AND project_id IS NULL LIMIT 1`
    );
    let storeId: number;
    if (existing.length === 0) {
      const result = await prisma.$queryRawUnsafe<{ id: number }[]>(
        `INSERT INTO finsync."Store" (name, company_id, description) VALUES ('${c.name}', ${c.id}, 'Default company store') RETURNING id`
      );
      storeId = result[0].id;
    } else {
      storeId = existing[0].id;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE finsync."StoreItem" SET store_id = ${storeId} WHERE company_id = ${c.id} AND store_id IS NULL`
    );
    console.log(`  ✓ Company #${c.id} (${c.name}): backfilled items → store #${storeId}`);
  }

  // Rename any leftover "Main Store" entries to match company names
  await prisma.$executeRawUnsafe(
    `UPDATE finsync."Store" SET name = c.name FROM finsync."Company" c WHERE finsync."Store".company_id = c.id AND finsync."Store".name = 'Main Store'`
  );
  console.log('  ✓ Renamed Main Store → company names');

  // Make store_id NOT NULL after backfill
  await prisma.$executeRawUnsafe(`ALTER TABLE finsync."StoreItem" ALTER COLUMN store_id SET NOT NULL`);
  console.log('  ✓ StoreItem.store_id → NOT NULL');

  console.log('✅ Migration complete!');
}

main()
  .then(() => prisma.$disconnect().then(() => pool.end()))
  .catch((e) => { console.error(e); prisma.$disconnect().then(() => pool.end()); process.exit(1); });
