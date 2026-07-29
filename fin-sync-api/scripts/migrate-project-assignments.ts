import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS finsync."ProjectAssignment" (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES finsync."Project"(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES finsync."User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "ProjectAssignment_projectId_userId_key" UNIQUE ("project_id", "user_id")
      );
    `);
    console.log('Migration SUCCESS: ProjectAssignment table created.');
  } catch (e) {
    console.error('Migration FAILED:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
