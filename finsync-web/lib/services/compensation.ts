import api from "../api";

export interface PayrollAllowance {
  id: number;
  companyId: number;
  employeeId: number;
  type: string;
  amount: number;
  isTaxable: boolean;
  reason?: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
}

export interface PayrollBonus {
  id: number;
  companyId: number;
  employeeId: number;
  type: string;
  amount: number;
  reason?: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
}

export interface PayrollWithholding {
  id: number;
  companyId: number;
  employeeId?: number;
  name: string;
  type: string;
  calcType: "FIXED" | "PERCENTAGE";
  amount: number;
  isGlobal: boolean;
  reason: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
}

export const compensationService = {
  // Allowances
  getAllowances: async (
    companyId: number,
    employeeId?: number,
  ): Promise<PayrollAllowance[]> => {
    const res = await api.get(`/companies/${companyId}/allowances`, {
      params: employeeId ? { employeeId } : {},
    });
    return res.data;
  },
  createAllowance: async (
    companyId: number,
    dto: any,
  ): Promise<PayrollAllowance> => {
    const res = await api.post(`/companies/${companyId}/allowances`, dto);
    return res.data;
  },
  updateAllowance: async (
    companyId: number,
    id: number,
    dto: any,
  ): Promise<PayrollAllowance> => {
    const res = await api.patch(
      `/companies/${companyId}/allowances/${id}`,
      dto,
    );
    return res.data;
  },
  deleteAllowance: async (companyId: number, id: number) => {
    const res = await api.delete(`/companies/${companyId}/allowances/${id}`);
    return res.data;
  },

  // Bonuses
  getBonuses: async (
    companyId: number,
    employeeId?: number,
  ): Promise<PayrollBonus[]> => {
    const res = await api.get(`/companies/${companyId}/bonuses`, {
      params: employeeId ? { employeeId } : {},
    });
    return res.data;
  },
  createBonus: async (companyId: number, dto: any): Promise<PayrollBonus> => {
    const res = await api.post(`/companies/${companyId}/bonuses`, dto);
    return res.data;
  },
  updateBonus: async (
    companyId: number,
    id: number,
    dto: any,
  ): Promise<PayrollBonus> => {
    const res = await api.patch(`/companies/${companyId}/bonuses/${id}`, dto);
    return res.data;
  },
  deleteBonus: async (companyId: number, id: number) => {
    const res = await api.delete(`/companies/${companyId}/bonuses/${id}`);
    return res.data;
  },

  // Withholdings
  getWithholdings: async (
    companyId: number,
    employeeId?: number,
  ): Promise<PayrollWithholding[]> => {
    const res = await api.get(`/companies/${companyId}/withholdings`, {
      params: employeeId ? { employeeId } : {},
    });
    return res.data;
  },
  createWithholding: async (
    companyId: number,
    dto: any,
  ): Promise<PayrollWithholding> => {
    const res = await api.post(`/companies/${companyId}/withholdings`, dto);
    return res.data;
  },
  updateWithholding: async (
    companyId: number,
    id: number,
    dto: any,
  ): Promise<PayrollWithholding> => {
    const res = await api.patch(
      `/companies/${companyId}/withholdings/${id}`,
      dto,
    );
    return res.data;
  },
  deleteWithholding: async (companyId: number, id: number) => {
    const res = await api.delete(`/companies/${companyId}/withholdings/${id}`);
    return res.data;
  },
};
