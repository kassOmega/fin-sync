import api from "../api";
import type {
  DepreciationMethod,
  DepreciationSchedule,
  NetBookValue,
} from "./types";

export interface EnableDepreciationDto {
  purchaseDate?: string;
  purchaseCost: number;
  residualValue?: number;
  usefulLifeYears?: number;
  depMethodId: number;
}

export const depreciationService = {
  // Methods
  getMethods: async (companyId: number): Promise<DepreciationMethod[]> => {
    const res = await api.get(`/companies/${companyId}/depreciations/methods`);
    return res.data;
  },

  createMethod: async (
    companyId: number,
    dto: {
      name: string;
      type: string;
      defaultRate: number;
      defaultUsefulLifeYears?: number;
    },
  ): Promise<DepreciationMethod> => {
    const res = await api.post(
      `/companies/${companyId}/depreciations/methods`,
      dto,
    );
    return res.data;
  },

  // Machinery config
  enableDepreciation: async (
    companyId: number,
    machineryId: number,
    dto: EnableDepreciationDto,
  ) => {
    const res = await api.patch(
      `/companies/${companyId}/depreciations/machineries/${machineryId}`,
      dto,
    );
    return res.data;
  },

  // Generation & Posting
  generate: async (companyId: number, month?: string) => {
    const res = await api.post(
      `/companies/${companyId}/depreciations/generate`,
      null,
      {
        params: month ? { month } : {},
      },
    );
    return res.data;
  },

  postMonth: async (companyId: number, month?: string) => {
    const res = await api.post(
      `/companies/${companyId}/depreciations/post`,
      null,
      {
        params: month ? { month } : {},
      },
    );
    return res.data;
  },

  postSchedule: async (
    companyId: number,
    scheduleId: number,
  ): Promise<DepreciationSchedule> => {
    const res = await api.post(
      `/companies/${companyId}/depreciations/schedules/${scheduleId}/post`,
    );
    return res.data;
  },

  // Queries
  getSchedules: async (
    companyId: number,
    machineryId?: number,
  ): Promise<DepreciationSchedule[]> => {
    const res = await api.get(
      `/companies/${companyId}/depreciations/schedules`,
      {
        params: machineryId ? { machineryId } : {},
      },
    );
    return res.data;
  },

  getNetBookValues: async (companyId: number): Promise<NetBookValue[]> => {
    const res = await api.get(
      `/companies/${companyId}/depreciations/net-book-value`,
    );
    return res.data;
  },
};
