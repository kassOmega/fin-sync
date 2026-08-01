import api from "../api";
import type {
  StoreCategory,
  StoreItem,
  StoreRequest,
  StoreTransaction,
} from "./types";

export interface CreateStoreItemDto {
  name: string;
  categoryId: number;
  quantity?: number;
  lowStockThreshold?: number;
  unit?: string;
  sellingPrice?: number;
  costPrice?: number;
  isTool?: boolean;
}

export interface StoreTransactionDto {
  type: "ISSUE" | "RESTOCK" | "RETURN";
  quantity: number;
  issuedToUserId?: number;
  issuedById?: number;
  projectId?: number;
}

export interface CreateStoreRequestDto {
  companyId: number;
  itemId: number;
  quantity: number;
  projectId?: number;
}

export const storeService = {
  // Items
  listItems: async (
    companyId: number,
    categoryId?: number,
  ): Promise<StoreItem[]> => {
    const res = await api.get(`/companies/${companyId}/store-items`, {
      params: categoryId ? { categoryId } : {},
    });
    return res.data;
  },

  createItem: async (
    companyId: number,
    dto: CreateStoreItemDto,
  ): Promise<StoreItem> => {
    const res = await api.post(`/companies/${companyId}/store-items`, dto);
    return res.data;
  },

  updateItem: async (
    companyId: number,
    id: number,
    dto: Partial<CreateStoreItemDto>,
  ): Promise<StoreItem> => {
    const res = await api.patch(
      `/companies/${companyId}/store-items/${id}`,
      dto,
    );
    return res.data;
  },

  deleteItem: async (companyId: number, id: number) => {
    const res = await api.delete(`/companies/${companyId}/store-items/${id}`);
    return res.data;
  },

  // Categories
  listCategories: async (companyId: number): Promise<StoreCategory[]> => {
    const res = await api.get(`/companies/${companyId}/store-items/categories`);
    return res.data;
  },

  createCategory: async (
    companyId: number,
    name: string,
  ): Promise<StoreCategory> => {
    const res = await api.post(
      `/companies/${companyId}/store-items/categories`,
      {
        name,
      },
    );
    return res.data;
  },

  // Transactions
  handleTransaction: async (
    companyId: number,
    itemId: number,
    dto: StoreTransactionDto,
  ): Promise<StoreItem> => {
    const res = await api.post(
      `/companies/${companyId}/store-items/${itemId}/transaction`,
      dto,
    );
    return res.data;
  },

  // Requests (cross-company + company-scoped)
  createRequest: async (dto: CreateStoreRequestDto): Promise<StoreRequest> => {
    const res = await api.post(`/store-requests`, dto);
    return res.data;
  },

  getMyRequests: async (): Promise<StoreRequest[]> => {
    const res = await api.get(`/store-requests/my`);
    return res.data;
  },

  getAllRequests: async (): Promise<StoreRequest[]> => {
    const res = await api.get(`/store-requests/all`);
    return res.data;
  },

  getCompanyRequests: async (companyId: number): Promise<StoreRequest[]> => {
    const res = await api.get(`/companies/${companyId}/store-items/requests`);
    return res.data;
  },

  approveRequest: async (id: number): Promise<StoreRequest> => {
    const res = await api.patch(`/store-requests/${id}/approve`);
    return res.data;
  },

  rejectRequest: async (id: number): Promise<StoreRequest> => {
    const res = await api.patch(`/store-requests/${id}/reject`);
    return res.data;
  },

  issueRequest: async (
    id: number,
    quantity?: number,
  ): Promise<StoreRequest> => {
    const res = await api.patch(`/store-requests/${id}/issue`, {
      ...(quantity !== undefined ? { quantity } : {}),
    });
    return res.data;
  },

  returnItem: (companyId: number, requestId: number): Promise<StoreRequest> => {
    return api
      .patch(`/companies/${companyId}/store-items/requests/${requestId}/return`)
      .then((res) => res.data);
  },

  // Transactions history (optional utility)
  listTransactions: async (
    companyId: number,
    itemId?: number,
  ): Promise<StoreTransaction[]> => {
    const res = await api.get(
      `/companies/${companyId}/store-items/transactions`,
      {
        params: itemId ? { itemId } : {},
      },
    );
    return res.data;
  },
};
