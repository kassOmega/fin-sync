import api from "../api";

export interface OvertimeRate {
  id: number;
  companyId: number;
  name: string;
  multiplier: number;
  isActive: boolean;
}

export interface OvertimeEntry {
  id: number;
  companyId: number;
  employeeId: number;
  overtimeRateId?: number;
  date: string;
  hours: number;
  hourlyRate: number;
  multiplier: number;
  amount: number;
  status: "DRAFT" | "APPROVED" | "REJECTED";
  reason?: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  overtimeRate?: { id: number; name: string; multiplier: number };
}

export const overtimeService = {
  // Rates
  getRates: async (companyId: number): Promise<OvertimeRate[]> => {
    const res = await api.get(`/companies/${companyId}/overtime/rates`);
    return res.data;
  },
  createRate: async (
    companyId: number,
    dto: { name: string; multiplier: number },
  ): Promise<OvertimeRate> => {
    const res = await api.post(`/companies/${companyId}/overtime/rates`, dto);
    return res.data;
  },
  updateRate: async (
    companyId: number,
    rateId: number,
    dto: any,
  ): Promise<OvertimeRate> => {
    const res = await api.patch(
      `/companies/${companyId}/overtime/rates/${rateId}`,
      dto,
    );
    return res.data;
  },
  deleteRate: async (companyId: number, rateId: number) => {
    const res = await api.delete(
      `/companies/${companyId}/overtime/rates/${rateId}`,
    );
    return res.data;
  },

  // Entries
  getEntries: async (
    companyId: number,
    params?: any,
  ): Promise<OvertimeEntry[]> => {
    const res = await api.get(`/companies/${companyId}/overtime/entries`, {
      params,
    });
    return res.data;
  },
  createEntry: async (companyId: number, dto: any): Promise<OvertimeEntry> => {
    const res = await api.post(`/companies/${companyId}/overtime/entries`, dto);
    return res.data;
  },
  approveEntry: async (
    companyId: number,
    entryId: number,
  ): Promise<OvertimeEntry> => {
    const res = await api.patch(
      `/companies/${companyId}/overtime/entries/${entryId}/approve`,
    );
    return res.data;
  },
  rejectEntry: async (
    companyId: number,
    entryId: number,
  ): Promise<OvertimeEntry> => {
    const res = await api.patch(
      `/companies/${companyId}/overtime/entries/${entryId}/reject`,
    );
    return res.data;
  },
  deleteEntry: async (companyId: number, entryId: number) => {
    const res = await api.delete(
      `/companies/${companyId}/overtime/entries/${entryId}`,
    );
    return res.data;
  },
};
