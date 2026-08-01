import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get the next entry number for a company.
   */
  private async getNextEntryNumber(companyId: number): Promise<string> {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM finsync.journal_entries WHERE "companyId" = ${companyId}`,
    );
    const count = parseInt(rows[0]?.cnt || '0', 10) + 1;
    return `JE-${companyId}-${String(count).padStart(6, '0')}`;
  }

  /**
   * Create a manual journal entry (DRAFT status). Validates debit=credit balance.
   */
  async createManualEntry(
    companyId: number,
    dto: CreateJournalEntryDto,
    userId: number,
  ) {
    // Validate debits = credits
    const totalDebit = dto.lines.reduce(
      (sum, line) => sum + (line.debit || 0),
      0,
    );
    const totalCredit = dto.lines.reduce(
      (sum, line) => sum + (line.credit || 0),
      0,
    );

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException(
        `Journal entry is not balanced. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`,
      );
    }

    if (dto.lines.length < 2) {
      throw new BadRequestException(
        'Journal entry must have at least 2 lines.',
      );
    }

    const entryNumber = await this.getNextEntryNumber(companyId);

    return this.prisma.$transaction(async (prisma) => {
      const entry = await prisma.journalEntry.create({
        data: {
          companyId,
          entryNumber,
          date: dto.date ? new Date(dto.date) : new Date(),
          description: dto.description,
          status: 'DRAFT',
          sourceType: 'MANUAL',
          projectId: dto.projectId ?? null,
          postedById: userId,
          lines: {
            create: dto.lines.map((line) => ({
              accountId: line.accountId,
              description: line.description,
              debit: line.debit || 0,
              credit: line.credit || 0,
            })),
          },
        },
        include: {
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });

      return entry;
    });
  }

  /**
   * Post a DRAFT entry — changes status to POSTED and records timestamp.
   */
  async postEntry(entryId: number, userId: number) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    if (entry.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot post entry with status "${entry.status}". Only DRAFT entries can be posted.`,
      );
    }

    return this.prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        status: 'POSTED',
        postedById: userId,
        postedAt: new Date(),
      },
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Void a POSTED entry. Creates a reversing entry.
   */
  /**
   * Void (mark as VOIDED) all journal entries for a given source type + source id.
   * Used when an income/expense/purchase is updated or deleted so the ledger
   * stays consistent — the entry is marked VOIDED, never hard-deleted.
   */
  async voidBySource(companyId: number, sourceType: string, sourceId: number) {
    const entries = await this.prisma.journalEntry.findMany({
      where: { companyId, sourceType, sourceId, status: { not: 'VOIDED' } },
    });
    for (const entry of entries) {
      await this.prisma.journalEntry.update({
        where: { id: entry.id },
        data: { status: 'VOIDED' },
      });
    }
    return { voided: entries.length };
  }

  async voidEntry(entryId: number, userId: number) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: true },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    if (entry.status !== 'POSTED') {
      throw new BadRequestException('Only POSTED entries can be voided.');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Mark original as voided
      await prisma.journalEntry.update({
        where: { id: entryId },
        data: { status: 'VOIDED' },
      });

      // Create reversing entry
      const entryNumber = await this.getNextEntryNumber(entry.companyId);
      const reversal = await prisma.journalEntry.create({
        data: {
          companyId: entry.companyId,
          entryNumber,
          date: new Date(),
          description: `VOID reversal of ${entry.entryNumber}: ${entry.description}`,
          status: 'POSTED',
          sourceType: 'MANUAL',
          projectId: entry.projectId,
          postedById: userId,
          postedAt: new Date(),
          lines: {
            create: entry.lines.map((line) => ({
              accountId: line.accountId,
              description: `Reversal of ${entry.entryNumber}`,
              debit: line.credit, // Swap debit/credit
              credit: line.debit,
            })),
          },
        },
        include: {
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });

      return { voided: entryId, reversal };
    });
  }

  /**
   * Auto-create and post a journal entry from a transaction source.
   * Used by income, expense, sale, purchase, and payroll services.
   *
   * Each line can reference an account by `accountId` (direct match) or
   * `accountCode` (resolved to an id via the company's CoA). If neither
   * resolves the account is skipped.
   */
  async createAutoEntry(
    companyId: number,
    data: {
      sourceType: string;
      sourceId: number;
      description: string;
      date: Date;
      projectId?: number;
      lines: Array<{
        accountId?: number;
        accountCode?: string;
        description?: string;
        debit: number;
        credit: number;
      }>;
    },
    userId?: number,
  ) {
    const entryNumber = await this.getNextEntryNumber(companyId);

    // Resolve account codes to IDs where needed
    const codeMap = new Map<string, number>();
    for (const line of data.lines) {
      if (!line.accountId && line.accountCode) {
        if (!codeMap.has(line.accountCode)) {
          const acc: any = await this.prisma.account.findFirst({
            where: { companyId, code: line.accountCode },
            select: { id: true },
          });
          if (acc) codeMap.set(line.accountCode, acc.id);
        }
      }
    }

    return this.prisma.journalEntry.create({
      data: {
        companyId,
        entryNumber,
        date: data.date,
        description: data.description,
        status: 'POSTED',
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        projectId: data.projectId ?? null,
        postedById: userId ?? null,
        postedAt: new Date(),
        lines: {
          create: data.lines
            .map((line) => {
              const resolvedId =
                line.accountId || codeMap.get(line.accountCode || '');
              if (!resolvedId) return null;
              return {
                accountId: resolvedId,
                description: line.description,
                debit: line.debit,
                credit: line.credit,
              };
            })
            .filter(Boolean) as any[],
        },
      },
    });
  }

  /**
   * Get all journal entries for a company, with optional filters.
   */
  async findAll(
    companyId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
      accountId?: number;
      sourceType?: string;
      status?: string;
      projectId?: number;
    },
  ) {
    const where: any = { companyId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.sourceType) {
      where.sourceType = filters.sourceType;
    }
    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    const include: any = {
      lines: {
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
        },
      },
      postedBy: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    };

    // If filtering by account, we need to use a nested filter
    if (filters?.accountId) {
      return this.prisma.journalEntry.findMany({
        where: {
          ...where,
          lines: { some: { accountId: filters.accountId } },
        },
        include,
        orderBy: { date: 'desc' },
        take: 200,
      });
    }

    return this.prisma.journalEntry.findMany({
      where,
      include,
      orderBy: { date: 'desc' },
      take: 200,
    });
  }

  /**
   * Get a single journal entry by ID.
   */
  async findOne(companyId: number, id: number) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, companyId },
      include: {
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true, type: true },
            },
          },
        },
        postedBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    return entry;
  }

  /**
   * Get the General Ledger for a specific account (or all accounts).
   */
  async getLedger(
    companyId: number,
    accountId?: number,
    startDate?: string,
    endDate?: string,
  ) {
    const lineWhere: any = {};

    if (accountId) {
      lineWhere.accountId = accountId;
    }

    const entryWhere: any = {
      companyId,
      status: 'POSTED',
    };

    if (startDate || endDate) {
      entryWhere.date = {};
      if (startDate) entryWhere.date.gte = new Date(startDate);
      if (endDate) entryWhere.date.lte = new Date(endDate);
    }

    const lines = await this.prisma.journalLine.findMany({
      where: {
        ...lineWhere,
        entry: entryWhere,
      },
      include: {
        entry: {
          select: {
            id: true,
            entryNumber: true,
            date: true,
            description: true,
            sourceType: true,
          },
        },
        account: { select: { id: true, code: true, name: true, type: true } },
      },
      orderBy: [{ entry: { date: 'asc' } }, { id: 'asc' }],
    });

    // Calculate running balance
    let runningBalance = 0;
    return lines.map((line) => {
      runningBalance += Number(line.debit) - Number(line.credit);
      return {
        ...line,
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });
  }

  /**
   * Get the Trial Balance (summarized debit/credit per account).
   */
  async getTrialBalance(companyId: number, asOfDate?: string) {
    const dateFilter = asOfDate ? `AND je.date <= '${asOfDate}'` : '';

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT
        a.id,
        a.code,
        a.name,
        a.type,
        a."normalSide",
        COALESCE(SUM(jl.debit), 0) AS "totalDebit",
        COALESCE(SUM(jl.credit), 0) AS "totalCredit"
       FROM finsync.accounts a
       LEFT JOIN finsync.journal_lines jl ON jl.account_id = a.id
       LEFT JOIN finsync.journal_entries je ON je.id = jl.entry_id AND je.status = 'POSTED'
         ${dateFilter}
       WHERE a."companyId" = ${companyId} AND a."isActive" = true
       GROUP BY a.id, a.code, a.name, a.type, a."normalSide"
       ORDER BY a.code ASC`,
    );

    const totalDebit = rows.reduce(
      (sum, r) => sum + parseFloat(r.totalDebit || 0),
      0,
    );
    const totalCredit = rows.reduce(
      (sum, r) => sum + parseFloat(r.totalCredit || 0),
      0,
    );

    return {
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
      accounts: rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        type: r.type,
        normalSide: r.normalSide,
        totalDebit: parseFloat(r.totalDebit || 0),
        totalCredit: parseFloat(r.totalCredit || 0),
        balance:
          r.normalSide === 'DEBIT'
            ? parseFloat(r.totalDebit || 0) - parseFloat(r.totalCredit || 0)
            : parseFloat(r.totalCredit || 0) - parseFloat(r.totalDebit || 0),
      })),
      totals: {
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        difference: Math.round((totalDebit - totalCredit) * 100) / 100,
      },
    };
  }

  /**
   * Balance Sheet: Assets = Liabilities + Equity at a point in time.
   */
  async getBalanceSheet(companyId: number, asOfDate?: string) {
    const trialBalance = await this.getTrialBalance(companyId, asOfDate);

    const assets = trialBalance.accounts.filter((a) => a.type === 'ASSET');
    const liabilities = trialBalance.accounts.filter(
      (a) => a.type === 'LIABILITY',
    );
    const equity = trialBalance.accounts.filter((a) => a.type === 'EQUITY');

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    return {
      asOfDate: trialBalance.asOfDate,
      assets: {
        accounts: assets,
        total: Math.round(totalAssets * 100) / 100,
      },
      liabilities: {
        accounts: liabilities,
        total: Math.round(totalLiabilities * 100) / 100,
      },
      equity: {
        accounts: equity,
        total: Math.round(totalEquity * 100) / 100,
      },
      totalLiabilitiesAndEquity:
        Math.round((totalLiabilities + totalEquity) * 100) / 100,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  /**
   * Income Statement (Profit & Loss) for a date range.
   */
  async getIncomeStatement(
    companyId: number,
    startDate: string,
    endDate: string,
  ) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT
        a.id,
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(jl.credit), 0) - COALESCE(SUM(jl.debit), 0) AS balance
       FROM finsync.accounts a
       LEFT JOIN finsync.journal_lines jl ON jl.account_id = a.id
       LEFT JOIN finsync.journal_entries je ON je.id = jl.entry_id
         AND je.status = 'POSTED'
         AND je.date >= '${startDate}'
         AND je.date <= '${endDate}'
       WHERE a."companyId" = ${companyId}
         AND a."isActive" = true
         AND a.type IN ('INCOME', 'EXPENSE')
       GROUP BY a.id, a.code, a.name, a.type
       ORDER BY a.code ASC`,
    );

    const incomeAccounts = rows.filter((r) => r.type === 'INCOME');
    const expenseAccounts = rows.filter((r) => r.type === 'EXPENSE');

    const totalIncome = incomeAccounts.reduce(
      (sum, r) => sum + parseFloat(r.balance || 0),
      0,
    );
    const totalExpense = expenseAccounts.reduce(
      (sum, r) => sum + parseFloat(r.balance || 0),
      0,
    );
    const netIncome = totalIncome - totalExpense;

    return {
      period: { startDate, endDate },
      income: {
        accounts: incomeAccounts.map((r) => ({
          ...r,
          balance: parseFloat(r.balance || 0),
        })),
        total: Math.round(totalIncome * 100) / 100,
      },
      expenses: {
        accounts: expenseAccounts.map((r) => ({
          ...r,
          balance: parseFloat(r.balance || 0),
        })),
        total: Math.round(totalExpense * 100) / 100,
      },
      netIncome: Math.round(netIncome * 100) / 100,
    };
  }
}
