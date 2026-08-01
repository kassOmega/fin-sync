import api from "../api";
import type {
  CompanyExpense,
  CompanyIncome,
  ProjectFinancialSummary,
  StoreRequest,
} from "./types";

export const projectsService = {
  // Projects
  list: async (companyId: number) => {
    const res = await api.get(`/companies/${companyId}/projects`);
    return res.data;
  },

  get: async (companyId: number, projectId: number) => {
    const res = await api.get(`/companies/${companyId}/projects/${projectId}`);
    return res.data;
  },

  // Project financials
  getFinancialSummary: async (
    companyId: number,
    projectId: number,
  ): Promise<ProjectFinancialSummary> => {
    const res = await api.get(
      `/companies/${companyId}/projects/${projectId}/report`,
    );
    return res.data;
  },

  // Project expenses & incomes
  getExpenses: async (
    companyId: number,
    projectId: number,
  ): Promise<CompanyExpense[]> => {
    const res = await api.get(
      `/companies/${companyId}/projects/${projectId}/expenses`,
    );
    return res.data;
  },

  getIncomes: async (
    companyId: number,
    projectId: number,
  ): Promise<CompanyIncome[]> => {
    const res = await api.get(
      `/companies/${companyId}/projects/${projectId}/incomes`,
    );
    return res.data;
  },

  // Project material requests (via store requests linked to project)
  getMaterialRequests: async (
    companyId: number,
    projectId: number,
  ): Promise<StoreRequest[]> => {
    const res = await api.get(
      `/companies/${companyId}/projects/${projectId}/store-requests`,
    );
    return res.data;
  },

  // Project machinery
  getMachineries: async (companyId: number, projectId: number) => {
    const res = await api.get(
      `/companies/${companyId}/projects/${projectId}/machineries`,
    );
    return res.data;
  },
};
