import api from "../api";
import type { Account } from "./types";

export interface CreateAccountDto {
  code: string;
  name: string;
  type: string;
  category?: string;
  normalSide?: string;
  parentId?: number;
  isActive?: boolean;
  description?: string;
}

export const accountsService = {
  // CRUD
  list: async (
    companyId: number,
    filters?: { type?: string; search?: string; isActive?: string },
  ): Promise<Account[]> => {
    const res = await api.get(`/companies/${companyId}/accounts`, {
      params: {
        ...(filters?.type && { type: filters.type }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
    });
    return res.data;
  },

  get: async (companyId: number, id: number): Promise<Account> => {
    const res = await api.get(`/companies/${companyId}/accounts/${id}`);
    return res.data;
  },

  create: async (
    companyId: number,
    dto: CreateAccountDto,
  ): Promise<Account> => {
    const res = await api.post(`/companies/${companyId}/accounts`, dto);
    return res.data;
  },

  update: async (
    companyId: number,
    id: number,
    dto: Partial<CreateAccountDto>,
  ): Promise<Account> => {
    const res = await api.patch(`/companies/${companyId}/accounts/${id}`, dto);
    return res.data;
  },

  remove: async (companyId: number, id: number) => {
    const res = await api.delete(`/companies/${companyId}/accounts/${id}`);
    return res.data;
  },

  // Tree view
  tree: async (companyId: number): Promise<Account[]> => {
    const res = await api.get(`/companies/${companyId}/accounts/tree`);
    return res.data;
  },
};
