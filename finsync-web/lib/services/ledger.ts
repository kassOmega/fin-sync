import api from "../api";
import type {
  BalanceSheet,
  IncomeStatement,
  JournalEntry,
  TrialBalance,
} from "./types";

export interface JournalLineInput {
  accountId: number;
  description?: string;
  debit: number;
  credit: number;
}

export interface CreateJournalEntryDto {
  description: string;
  date?: string;
  projectId?: number;
  lines: JournalLineInput[];
}

export const ledgerService = {
  list: async (
    companyId: number,
    params?: {
      startDate?: string;
      endDate?: string;
      accountId?: number;
      sourceType?: string;
      status?: string;
      projectId?: number;
    },
  ): Promise<JournalEntry[]> => {
    const res = await api.get(`/companies/${companyId}/ledger/entries`, {
      params,
    });
    return res.data;
  },

  get: async (companyId: number, id: number): Promise<JournalEntry> => {
    const res = await api.get(`/companies/${companyId}/ledger/entries/${id}`);
    return res.data;
  },

  create: async (
    companyId: number,
    dto: CreateJournalEntryDto,
  ): Promise<JournalEntry> => {
    const res = await api.post(`/companies/${companyId}/ledger/entries`, dto);
    return res.data;
  },

  post: async (companyId: number, id: number): Promise<JournalEntry> => {
    const res = await api.post(
      `/companies/${companyId}/ledger/entries/${id}/post`,
    );
    return res.data;
  },

  void: async (companyId: number, id: number) => {
    const res = await api.post(
      `/companies/${companyId}/ledger/entries/${id}/void`,
    );
    return res.data;
  },

  accountLedger: async (
    companyId: number,
    accountId: number,
    params?: { startDate?: string; endDate?: string },
  ) => {
    const res = await api.get(
      `/companies/${companyId}/ledger/accounts/${accountId}`,
      { params },
    );
    return res.data;
  },

  trialBalance: async (
    companyId: number,
    asOfDate?: string,
  ): Promise<TrialBalance> => {
    const res = await api.get(`/companies/${companyId}/ledger/trial-balance`, {
      params: asOfDate ? { asOfDate } : {},
    });
    return res.data;
  },

  balanceSheet: async (
    companyId: number,
    asOfDate?: string,
  ): Promise<BalanceSheet> => {
    const res = await api.get(`/companies/${companyId}/ledger/balance-sheet`, {
      params: asOfDate ? { asOfDate } : {},
    });
    return res.data;
  },

  incomeStatement: async (
    companyId: number,
    startDate: string,
    endDate: string,
  ): Promise<IncomeStatement> => {
    const res = await api.get(
      `/companies/${companyId}/ledger/income-statement`,
      { params: { startDate, endDate } },
    );
    return res.data;
  },
};
