import api from "@/global/api/axiosInstance";
import { UPLOAD_API } from "../upload.constants";
import type { UploadImage } from "../types";

export const uploadApi = {
  getMyUploads(weddingId: number) {
    return api.get<UploadImage[]>(UPLOAD_API.ME, {
      params: { weddingId },
    });
  },

  upload(weddingId: number, formData: FormData) {
    return api.post<UploadImage[]>(UPLOAD_API.BASE, formData, {
      params: { weddingId },
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteImage(id: number) {
    return api.delete(`${UPLOAD_API.BASE}/${id}`);
  },
};
