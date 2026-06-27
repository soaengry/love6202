import api from "@/global/api/axiosInstance";
import { GALLERY_API, GALLERY_VALIDATION } from "../gallery.constants";
import type { GalleryImage, GalleryListResponse } from "../types";

export const galleryApi = {
  upload(formData: FormData) {
    return api.post<GalleryImage[]>(GALLERY_API.BASE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300_000, // 파일당 S3 3회 업로드 + sharp 처리 → 최대 5분
    });
  },

  getList(weddingId: number, page: number) {
    return api.get<GalleryListResponse>(GALLERY_API.BASE, {
      params: { weddingId, page, size: GALLERY_VALIDATION.PAGE_SIZE },
    });
  },

  deleteImages(ids: number[]) {
    return api.delete(GALLERY_API.BASE, { data: { ids } });
  },
};
