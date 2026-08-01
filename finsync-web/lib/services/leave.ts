import api from "../api";
import type {
  LeaveBalance,
  LeaveCalendarEntry,
  LeaveRequest,
  LeaveType,
} from "./types";

export interface CreateLeaveTypeDto {
  name: string;
  isPaid?: boolean;
  defaultDaysPerYear?: number;
  maxCarryForwardDays?: number;
  requiresApproval?: boolean;
}

export interface CreateLeaveRequestDto {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  reason?: string;
}

export const leaveService = {
  // Types
  getTypes: async (companyId: number): Promise<LeaveType[]> => {
    const res = await api.get(`/companies/${companyId}/leaves/types`);
    return res.data;
  },

  createType: async (
    companyId: number,
    dto: CreateLeaveTypeDto,
  ): Promise<LeaveType> => {
    const res = await api.post(`/companies/${companyId}/leaves/types`, dto);
    return res.data;
  },

  updateType: async (
    companyId: number,
    id: number,
    dto: Partial<CreateLeaveTypeDto>,
  ): Promise<LeaveType> => {
    const res = await api.patch(
      `/companies/${companyId}/leaves/types/${id}`,
      dto,
    );
    return res.data;
  },

  deleteType: async (companyId: number, id: number) => {
    const res = await api.delete(`/companies/${companyId}/leaves/types/${id}`);
    return res.data;
  },

  // Balances
  getMyBalances: async (companyId: number): Promise<LeaveBalance[]> => {
    const res = await api.get(`/companies/${companyId}/leaves/balances`);
    return res.data;
  },

  getEmployeeBalances: async (
    companyId: number,
    employeeId: number,
  ): Promise<LeaveBalance[]> => {
    const res = await api.get(
      `/companies/${companyId}/leaves/employees/${employeeId}/balances`,
    );
    return res.data;
  },

  // Requests
  submitRequest: async (
    companyId: number,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> => {
    const res = await api.post(`/companies/${companyId}/leaves/requests`, dto);
    return res.data;
  },

  getMyRequests: async (
    companyId: number,
    status?: string,
  ): Promise<LeaveRequest[]> => {
    const res = await api.get(`/companies/${companyId}/leaves/requests`, {
      params: status ? { status } : {},
    });
    return res.data;
  },

  getCompanyRequests: async (
    companyId: number,
    status?: string,
  ): Promise<LeaveRequest[]> => {
    const res = await api.get(`/companies/${companyId}/leaves/requests/all`, {
      params: status ? { status } : {},
    });
    return res.data;
  },

  updateRequest: async (
    companyId: number,
    id: number,
    dto: Partial<CreateLeaveRequestDto>,
  ): Promise<{ updated: boolean; id: number; totalDays: number }> => {
    const res = await api.patch(
      `/companies/${companyId}/leaves/requests/${id}`,
      dto,
    );
    return res.data;
  },

  approveRequest: async (
    companyId: number,
    id: number,
  ): Promise<{ approved: boolean; id: number }> => {
    const res = await api.post(
      `/companies/${companyId}/leaves/requests/${id}/approve`,
    );
    return res.data;
  },

  rejectRequest: async (
    companyId: number,
    id: number,
    reason?: string,
  ): Promise<{ rejected: boolean; id: number }> => {
    const res = await api.post(
      `/companies/${companyId}/leaves/requests/${id}/reject`,
      { reason },
    );
    return res.data;
  },

  cancelRequest: async (
    companyId: number,
    id: number,
  ): Promise<{ cancelled: boolean; id: number }> => {
    const res = await api.post(
      `/companies/${companyId}/leaves/requests/${id}/cancel`,
    );
    return res.data;
  },

  // Calendar
  getCalendar: async (
    companyId: number,
    startDate: string,
    endDate: string,
  ): Promise<LeaveCalendarEntry[]> => {
    const res = await api.get(`/companies/${companyId}/leaves/calendar`, {
      params: { startDate, endDate },
    });
    return res.data;
  },
};
