import api from "../api";
import type {
  Store,
  StoreCategory,
  StoreItem,
  StoreRequest,
  StoreTransaction,
  StoreTransfer,
} from "./types";

export interface CreateStoreItemDto {
  name: string;
  categoryId: number;
  storeId: number;
  quantity?: number;
  lowStockThreshold?: number;
  unit?: string;
  sellingPrice?: number;
  costPrice?: number;
  isTool?: boolean;
}

export interface CreateStoreDto {
  name: string;
  projectId?: number;
  storekeeperId?: number;
  description?: string;
  isActive?: boolean;
}

export interface CreateTransferDto {
  fromStoreId: number;
  toStoreId: number;
  itemId: number;
  quantity: number;
  note?: string;
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
    storeId?: number,
  ): Promise<StoreItem[]> => {
    const params: Record<string, string> = {};
    if (categoryId) params.categoryId = String(categoryId);
    if (storeId) params.storeId = String(storeId);
    const res = await api.get(`/companies/${companyId}/store-items`, { params });
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

  // ── Store Management ──
  listStores: async (
    companyId: number,
    projectId?: number,
  ): Promise<Store[]> => {
    const params: Record<string, string> = {};
    if (projectId) params.projectId = String(projectId);
    const res = await api.get(`/companies/${companyId}/stores`, { params });
    return res.data;
  },

  // Fetch stores from multiple companies the user owns (for cross-company transfers)
  listAllAccessibleStores: async (companyIds: number[]): Promise<Store[]> => {
    const results = await Promise.all(
      companyIds.map((cid) =>
        api
          .get(`/companies/${cid}/stores`)
          .then((r) => r.data as Store[])
          .catch(() => [] as Store[]),
      ),
    );
    return results.flat();
  },

  getStore: async (companyId: number, storeId: number): Promise<Store> => {
    const res = await api.get(`/companies/${companyId}/stores/${storeId}`);
    return res.data;
  },

  createStore: async (
    companyId: number,
    dto: CreateStoreDto,
  ): Promise<Store> => {
    const res = await api.post(`/companies/${companyId}/stores`, dto);
    return res.data;
  },

  updateStore: async (
    companyId: number,
    storeId: number,
    dto: Partial<CreateStoreDto>,
  ): Promise<Store> => {
    const res = await api.patch(
      `/companies/${companyId}/stores/${storeId}`,
      dto,
    );
    return res.data;
  },

  deleteStore: async (companyId: number, storeId: number) => {
    const res = await api.delete(`/companies/${companyId}/stores/${storeId}`);
    return res.data;
  },

  // ── Project Store Management ──
  listProjectStores: async (
    companyId: number,
    projectId: number,
  ): Promise<Store[]> => {
    const res = await api.get(
      `/companies/${companyId}/projects/${projectId}/stores`,
    );
    return res.data;
  },

  createProjectStore: async (
    companyId: number,
    projectId: number,
    dto: CreateStoreDto,
  ): Promise<Store> => {
    const res = await api.post(
      `/companies/${companyId}/projects/${projectId}/stores`,
      dto,
    );
    return res.data;
  },

  // ── Store Transfers ──
  listTransfers: async (filters?: {
    fromStoreId?: number;
    toStoreId?: number;
    status?: string;
  }): Promise<StoreTransfer[]> => {
    const params: Record<string, string> = {};
    if (filters?.fromStoreId) params.fromStoreId = String(filters.fromStoreId);
    if (filters?.toStoreId) params.toStoreId = String(filters.toStoreId);
    if (filters?.status) params.status = filters.status;
    const res = await api.get("/stores/transfers", { params });
    return res.data;
  },

  getTransfer: async (id: number): Promise<StoreTransfer> => {
    const res = await api.get(`/stores/transfers/${id}`);
    return res.data;
  },

  requestTransfer: async (
    dto: CreateTransferDto,
  ): Promise<StoreTransfer> => {
    const res = await api.post("/stores/transfers", dto);
    return res.data;
  },

  approveTransfer: async (id: number): Promise<StoreTransfer> => {
    const res = await api.patch(`/stores/transfers/${id}/approve`);
    return res.data;
  },

  rejectTransfer: async (id: number): Promise<StoreTransfer> => {
    const res = await api.patch(`/stores/transfers/${id}/reject`);
    return res.data;
  },

  completeTransfer: async (id: number): Promise<StoreTransfer> => {
    const res = await api.patch(`/stores/transfers/${id}/complete`);
    return res.data;
  },
};
