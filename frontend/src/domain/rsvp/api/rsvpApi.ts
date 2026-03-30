import axios from "axios";
import api from "@/global/api/axiosInstance";
import { ENV } from "@/global/config/env";
import { RSVP_API, RSVP_VALIDATION } from "../rsvp.constants";
import type {
  RsvpCreateRequest,
  RsvpUpdateRequest,
  RsvpResponse,
  RsvpStatsResponse,
  RsvpListResponse,
} from "../types";

// ENV.API_BASE_URL 는 "/api" 프록시 없이 직접 주소이므로 프록시를 피해야 할 때 사용
// 보통의 api 인스턴스는 /api 경로를 기준으로 proxied됨

export const rsvpApi = {
  create(data: RsvpCreateRequest) {
    return api.post<RsvpResponse>(RSVP_API.BASE, data);
  },

  getMyRsvp(weddingId: number) {
    return api.get<RsvpResponse | null>(RSVP_API.ME, { params: { weddingId } });
  },

  update(id: number, data: RsvpUpdateRequest) {
    return api.put<RsvpResponse>(`${RSVP_API.BASE}/${id}`, data);
  },

  remove(id: number) {
    return api.delete(`${RSVP_API.BASE}/${id}`);
  },

  getStats(weddingId: number) {
    return api.get<RsvpStatsResponse>(RSVP_API.STATS, { params: { weddingId } });
  },

  getList(weddingId: number, page: number) {
    return api.get<RsvpListResponse>(RSVP_API.LIST, {
      params: { weddingId, page, size: RSVP_VALIDATION.PAGE_SIZE },
    });
  },

  // blob 응답은 인터셉터를 우회하여 raw axios로 직접 호출
  exportCsv(weddingId: number) {
    return axios.get(`${ENV.API_BASE_URL}/api${RSVP_API.EXPORT}`, {
      params: { weddingId },
      responseType: "blob",
      withCredentials: true,
    });
  },
};
