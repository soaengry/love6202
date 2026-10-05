import axios from "axios";
import api from "@/global/api/axiosInstance";
import { UPLOAD_API } from "../upload.constants";
import type { UploadImage, PresignFileRequest, PresignedUpload } from "../types";

export const uploadApi = {
  getMyUploads(weddingId: number) {
    return api.get<UploadImage[]>(UPLOAD_API.ME, {
      params: { weddingId },
    });
  },

  presign(weddingId: number, files: PresignFileRequest[]) {
    return api.post<PresignedUpload[]>(UPLOAD_API.PRESIGN, { files }, {
      params: { weddingId },
    });
  },

  // S3 presigned URL로 직접 PUT — API 서버를 거치지 않으므로 공용 인스턴스(쿠키·CSRF·응답 변환) 대신 기본 axios 사용
  putToS3(upload: PresignedUpload, file: File, onProgress?: (loaded: number) => void) {
    return axios.put(upload.uploadUrl, file, {
      headers: upload.headers,
      timeout: 300_000,
      onUploadProgress: (e) => onProgress?.(e.loaded),
    });
  },

  complete(weddingId: number, keys: string[]) {
    return api.post<UploadImage[]>(UPLOAD_API.COMPLETE, { keys }, {
      params: { weddingId },
    });
  },

  deleteImage(id: number) {
    return api.delete(`${UPLOAD_API.BASE}/${id}`);
  },
};
