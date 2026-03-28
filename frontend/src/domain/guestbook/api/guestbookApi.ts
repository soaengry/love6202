import api from "@/global/api/axiosInstance";
import { GUESTBOOK_API, GUESTBOOK_VALIDATION } from "../guestbook.constants";
import type { GuestbookEntry, GuestbookListResponse, GuestbookCreateRequest } from "../types";

export const guestbookApi = {
  getList(weddingId: number, page: number) {
    return api.get<GuestbookListResponse>(GUESTBOOK_API.BASE, {
      params: { weddingId, page, size: GUESTBOOK_VALIDATION.PAGE_SIZE },
    });
  },

  create(data: GuestbookCreateRequest) {
    return api.post<GuestbookEntry>(GUESTBOOK_API.BASE, data);
  },

  remove(id: number) {
    return api.delete(`${GUESTBOOK_API.BASE}/${id}`);
  },
};
