import { PrismaClient } from '@prisma/client';
import { SeedContext } from './utils';

/**
 * Backfills JournalEntry + JournalLine records from seeded financial data.
 * Called AFTER Chart of Accounts + Company Finance so accounts exist and
 * every income/expense/purchase gets a proper double-entry posting.
 *
 * Uses raw SQL and the physical snake_case column names — safe on any client.
 */
export async function seedJournalBackfill(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('📒 Seeding Journal Backfill (linking finance → ledger)...');

  const companyKeys = Object.keys(ctx.companies);
  let entryCount = 0;

  // Verify ledger tables exist; skip gracefully if schema not ready
  try {
    await prisma.$queryRawUnsafe(
      `SELECT 1 FROM finsync.journal_entries LIMIT 1`,
    );
  } catch {
    console.log('⚠️ journal_entries table missing — skipping backfill');
    return;
  }

  for (const companyKey of companyKeys) {
    const companyId = Number(ctx.companies[companyKey]);

    // Cache account ids by code for this company
    const accountRows: { id: number; code: string }[] =
      await prisma.$queryRawUnsafe(
        `SELECT id, code FROM finsync.accounts WHERE company_id = ${companyId}`,
      );
    const accountByCode = new Map<string, number>();
    for (const a of accountRows) accountByCode.set(a.code, a.id);
    const acc = (code: string) => accountByCode.get(code) ?? null;

    let seq = 0;

    // ── Incomes: Debit 1001 Cash / Credit 4100 Service Income ──
    const incomes: {
      id: number;
      amount: number;
      date: Date;
      category: string;
      project_id: number | null;
    }[] = await prisma.$queryRawUnsafe(
      `SELECT id, amount, date, category, project_id FROM finsync."CompanyIncome" WHERE company_id = ${companyId} ORDER BY id`,
    );
    for (const inc of incomes) {
      const cash = acc('1001');
      const rev = acc('4100');
      if (!cash || !rev) continue;
      seq++;
      const entryNumber = `JE-${companyId}-${String(seq).padStart(6, '0')}`;
      const existing: { id: number }[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM finsync.journal_entries WHERE company_id = ${companyId} AND "sourceType" = 'INCOME' AND "sourceId" = ${inc.id} LIMIT 1`,
      );
      if (existing.length > 0) continue;

      const inserted: { id: number }[] = await prisma.$queryRawUnsafe(
        `INSERT INTO finsync.journal_entries
           (company_id, "entryNumber", date, description, status, "sourceType", "sourceId", project_id, "postedAt", created_at, updated_at)
         VALUES (${companyId}, '${entryNumber}', '${inc.date.toISOString()}', 'Income: ${
           String(inc.category || '').replace(/'/g, "''") || 'Revenue'
         }', 'POSTED', 'INCOME', ${inc.id}, ${inc.project_id ?? 'NULL'}, NOW(), NOW(), NOW())
         RETURNING id`,
      );
      const entryId = inserted[0].id;
      await prisma.$executeRawUnsafe(
        `INSERT INTO finsync.journal_lines (entry_id, account_id, description, debit, credit)
         VALUES (${entryId}, ${cash}, 'Cash/Bank received', ${inc.amount}, 0),
                (${entryId}, ${rev}, '${String(inc.category || '').replace(/'/g, "''")}', 0, ${inc.amount})`,
      );
      entryCount++;
    }

    // ── Expenses: Debit 5230 Misc Expense / Credit 1001 Cash ──
    const expenses: {
      id: number;
      amount: number;
      date: Date;
      category: string;
      project_id: number | null;
    }[] = await prisma.$queryRawUnsafe(
      `SELECT id, amount, date, category, project_id FROM finsync."CompanyExpense" WHERE company_id = ${companyId} ORDER BY id`,
    );
    for (const exp of expenses) {
      const cash = acc('1001');
      const expAcc = acc('5230');
      if (!cash || !expAcc) continue;
      seq++;
      const entryNumber = `JE-${companyId}-${String(seq).padStart(6, '0')}`;
      const existing: { id: number }[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM finsync.journal_entries WHERE company_id = ${companyId} AND "sourceType" = 'EXPENSE' AND "sourceId" = ${exp.id} LIMIT 1`,
      );
      if (existing.length > 0) continue;

      const inserted: { id: number }[] = await prisma.$queryRawUnsafe(
        `INSERT INTO finsync.journal_entries
           (company_id, "entryNumber", date, description, status, "sourceType", "sourceId", project_id, "postedAt", created_at, updated_at)
         VALUES (${companyId}, '${entryNumber}', '${exp.date.toISOString()}', 'Expense: ${
           String(exp.category || '').replace(/'/g, "''") || 'Misc'
         }', 'POSTED', 'EXPENSE', ${exp.id}, ${exp.project_id ?? 'NULL'}, NOW(), NOW(), NOW())
         RETURNING id`,
      );
      const entryId = inserted[0].id;
      await prisma.$executeRawUnsafe(
        `INSERT INTO finsync.journal_lines (entry_id, account_id, description, debit, credit)
         VALUES (${entryId}, ${expAcc}, '${String(exp.category || '').replace(/'/g, "''")}', ${exp.amount}, 0),
                (${entryId}, ${cash}, 'Cash/Bank payment', 0, ${exp.amount})`,
      );
      entryCount++;
    }

    // ── Purchases: Debit 1201 Raw Materials Inventory / Credit 1001 Cash ──
    const purchases: {
      id: number;
      totalAmount: number;
      date: Date;
    }[] = await prisma.$queryRawUnsafe(
      `SELECT id, "totalAmount", date FROM finsync."Purchase" WHERE company_id = ${companyId} ORDER BY id`,
    );
    for (const pur of purchases) {
      const cash = acc('1001');
      const inv = acc('1201');
      if (!cash || !inv) continue;
      seq++;
      const entryNumber = `JE-${companyId}-${String(seq).padStart(6, '0')}`;
      const existing: { id: number }[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM finsync.journal_entries WHERE company_id = ${companyId} AND "sourceType" = 'PURCHASE' AND "sourceId" = ${pur.id} LIMIT 1`,
      );
      if (existing.length > 0) continue;

      const inserted: { id: number }[] = await prisma.$queryRawUnsafe(
        `INSERT INTO finsync.journal_entries
           (company_id, "entryNumber", date, description, status, "sourceType", "sourceId", "postedAt", created_at, updated_at)
         VALUES (${companyId}, '${entryNumber}', '${pur.date.toISOString()}', 'Purchase #${pur.id}', 'POSTED', 'PURCHASE', ${pur.id}, NOW(), NOW(), NOW())
         RETURNING id`,
      );
      const entryId = inserted[0].id;
      await prisma.$executeRawUnsafe(
        `INSERT INTO finsync.journal_lines (entry_id, account_id, description, debit, credit)
         VALUES (${entryId}, ${inv}, 'Inventory received', ${pur.totalAmount}, 0),
                (${entryId}, ${cash}, 'Cash/Bank payment', 0, ${pur.totalAmount})`,
      );
      entryCount++;
    }
  }

  console.log(
    `   ✅ Backfilled ${entryCount} journal entries from finance data`,
  );
}
