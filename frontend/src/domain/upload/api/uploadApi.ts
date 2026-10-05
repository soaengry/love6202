import api from "@/global/api/axiosInstance";
import { UPLOAD_API } from "../upload.constants";
import type { UploadImage } from "../types";

export const uploadApi = {
  getMyUploads(weddingId: number) {
    return api.get<UploadImage[]>(UPLOAD_API.ME, {
      params: { weddingId },
    });
  },

  upload(weddingId: number, formData: FormData, onProgress?: (percent: number) => void) {
    return api.post<UploadImage[]>(UPLOAD_API.BASE, formData, {
      params: { weddingId },
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
  },

  deleteImage(id: number) {
    return api.delete(`${UPLOAD_API.BASE}/${id}`);
  },
};
