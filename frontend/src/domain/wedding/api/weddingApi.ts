import api from "@/global/api/axiosInstance.ts";
import type { WeddingDetailResponse, BankResponse } from "../types.ts";
import { WEDDING_API, BANK_API } from "../wedding.constants.ts";

export const weddingApi = {
  create(formData: FormData) {
    return api.post<WeddingDetailResponse>(WEDDING_API.BASE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update(id: number, formData: FormData) {
    return api.put<WeddingDetailResponse>(WEDDING_API.DETAIL(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getMyWedding() {
    return api.get<WeddingDetailResponse>(WEDDING_API.ME);
  },

  getWedding(id: number) {
    return api.get<WeddingDetailResponse>(WEDDING_API.DETAIL(id));
  },

  deleteWedding(id: number) {
    return api.delete(WEDDING_API.DETAIL(id));
  },

  getBanks() {
    return api.get<BankResponse[]>(BANK_API.LIST);
  },

  detectBank(accountNumber: string) {
    return api.get<{ bankCode: string; bankName: string }>(`${BANK_API.DETECT}?accountNumber=${encodeURIComponent(accountNumber)}`);
  },
};
