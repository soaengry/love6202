import api from "@/global/api/axiosInstance.ts";
import { ADMIN_API } from "../admin.constants.ts";
import type { AdminWeddingListItem, AdminUserSearchResult, UserRole } from "../types.ts";

export const adminApi = {
  getWeddings() {
    return api.get<AdminWeddingListItem[]>(ADMIN_API.WEDDINGS);
  },

  pinWedding(id: number) {
    return api.patch<AdminWeddingListItem>(ADMIN_API.PIN_WEDDING(id));
  },

  searchUsers(query: string) {
    return api.get<AdminUserSearchResult[]>(ADMIN_API.SEARCH_USERS, {
      params: { query },
    });
  },

  changeUserRole(userId: number, role: UserRole) {
    return api.patch<AdminUserSearchResult>(ADMIN_API.CHANGE_ROLE(userId), { role });
  },
};
