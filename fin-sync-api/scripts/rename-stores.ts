import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { URL } from 'url';

dotenv.config();
const u = new URL(process.env.DATABASE_URL!);
const s = u.searchParams.get('schema') || 'finsync';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, options: `-c search_path=${s}` });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

(async () => {
  // Rename Main Store → company names
  await prisma.$executeRawUnsafe(`UPDATE finsync."Store" SET name = c.name FROM finsync."Company" c WHERE finsync."Store".company_id = c.id AND finsync."Store".name = 'Main Store'`);
  console.log('✓ Renamed Main Store → company names');

  // Create stores for projects without one
  const projects = await prisma.$queryRawUnsafe<{ id: number; name: string; companyId: number }[]>(`SELECT id, name, "companyId" FROM finsync.projects`);
  for (const p of projects) {
    const ex = await prisma.$queryRawUnsafe<{ id: number }[]>(`SELECT id FROM finsync."Store" WHERE project_id = ${p.id}`);
    if (ex.length === 0) {
      await prisma.$executeRawUnsafe(`INSERT INTO finsync."Store" (name, company_id, project_id) VALUES ('${p.name.replace(/'/g, "''")}', ${p.companyId}, ${p.id})`);
      console.log(`  + ${p.name} (project)`);
    }
  }

  const stores = await prisma.$queryRawUnsafe<{ id: number; name: string; company_id: number; project_id: number | null }[]>(`SELECT id, name, company_id, project_id FROM finsync."Store" ORDER BY company_id`);
  stores.forEach((r) => console.log(`  ${r.id}: ${r.name}${r.project_id ? ' [project]' : ' [company]'}`));

  console.log('Done.');
  await prisma.$disconnect();
  await pool.end();
})();
