import api from "../api";

export interface EmployeeSpecificAllowance {
  id: number;
  companyId: number;
  employeeId: number;
  name: string;
  amount: number;
  isTaxable: boolean;
  reason?: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
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
  // Employee-Specific Allowances
  getEmployeeSpecificAllowances: async (
    companyId: number,
    employeeId?: number,
  ): Promise<EmployeeSpecificAllowance[]> => {
    const res = await api.get(`/companies/${companyId}/employee-specific-allowances`, {
      params: employeeId ? { employeeId } : {},
    });
    return res.data;
  },
  createEmployeeSpecificAllowance: async (
    companyId: number,
    dto: any,
  ): Promise<EmployeeSpecificAllowance> => {
    const res = await api.post(`/companies/${companyId}/employee-specific-allowances`, dto);
    return res.data;
  },
  updateEmployeeSpecificAllowance: async (
    companyId: number,
    id: number,
    dto: any,
  ): Promise<EmployeeSpecificAllowance> => {
    const res = await api.patch(
      `/companies/${companyId}/employee-specific-allowances/${id}`,
      dto,
    );
    return res.data;
  },
  deleteEmployeeSpecificAllowance: async (companyId: number, id: number) => {
    const res = await api.delete(`/companies/${companyId}/employee-specific-allowances/${id}`);
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
