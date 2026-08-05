import api from "../api";
import type {
  Payroll,
  PayrollDeduction,
  PayrollItem,
  PayrollSourceType,
  Payslip,
  TaxTable,
} from "./types";

export interface GeneratePayrollDto {
  title: string;
  startDate: string;
  endDate: string;
  projectId?: number;
  sourceType?: Exclude<PayrollSourceType, "DAILY_LABORERS">;
}

/** Response of POST /payroll/generate (employee payroll). */
export interface GeneratePayrollResult extends Payroll {
  itemsGenerated: number;
}

export const payrollService = {
  // Payroll runs
  list: async (
    companyId: number,
    filters?: {
      projectId?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Payroll[]> => {
    const res = await api.get(`/companies/${companyId}/payroll`, {
      params: {
        ...(filters?.projectId && { projectId: filters.projectId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && { startDate: filters.startDate }),
        ...(filters?.endDate && { endDate: filters.endDate }),
      },
    });
    return res.data;
  },

  generate: async (
    companyId: number,
    dto: GeneratePayrollDto,
  ): Promise<GeneratePayrollResult> => {
    const res = await api.post(`/companies/${companyId}/payroll/generate`, dto);
    return res.data;
  },

  rename: async (
    companyId: number,
    id: number,
    title: string,
  ): Promise<{ updated: boolean; id: number; title: string }> => {
    const res = await api.patch(`/companies/${companyId}/payroll/${id}`, {
      title,
    });
    return res.data;
  },

  remove: async (
    companyId: number,
    id: number,
  ): Promise<{ deleted: boolean; id: number }> => {
    const res = await api.delete(`/companies/${companyId}/payroll/${id}`);
    return res.data;
  },

  approve: async (
    companyId: number,
    id: number,
  ): Promise<{ approved: boolean; id: number; expenseCreated: boolean }> => {
    const res = await api.patch(
      `/companies/${companyId}/payroll/${id}/approve`,
    );
    return res.data;
  },

  markPaid: async (
    companyId: number,
    id: number,
  ): Promise<{ paid: boolean; id: number; amount: number }> => {
    const res = await api.patch(`/companies/${companyId}/payroll/${id}/paid`);
    return res.data;
  },

  items: async (companyId: number, id: number): Promise<PayrollItem[]> => {
    const res = await api.get(`/companies/${companyId}/payroll/${id}/items`);
    return res.data;
  },

  payslip: async (
    companyId: number,
    payrollId: number,
    itemId: number,
  ): Promise<Payslip> => {
    const res = await api.get(
      `/companies/${companyId}/payroll/${payrollId}/items/${itemId}/payslip`,
    );
    return res.data;
  },

  // Tax tables
  getTaxTables: async (companyId: number): Promise<TaxTable[]> => {
    const res = await api.get(`/companies/${companyId}/payroll/tax-tables`);
    return res.data;
  },

  createTaxTable: async (
    companyId: number,
    dto: {
      name: string;
      description?: string;
      brackets: Array<{
        minIncome: number;
        maxIncome?: number;
        rate: number;
        fixedAmount?: number;
      }>;
    },
  ): Promise<TaxTable> => {
    const res = await api.post(
      `/companies/${companyId}/payroll/tax-tables`,
      dto,
    );
    return res.data;
  },

  // Deduction rules
  getDeductions: async (companyId: number): Promise<PayrollDeduction[]> => {
    const res = await api.get(`/companies/${companyId}/payroll/deductions`);
    return res.data;
  },

  createDeduction: async (
    companyId: number,
    dto: { name: string; type: string; value: number },
  ): Promise<PayrollDeduction> => {
    const res = await api.post(
      `/companies/${companyId}/payroll/deductions`,
      dto,
    );
    return res.data;
  },
};
