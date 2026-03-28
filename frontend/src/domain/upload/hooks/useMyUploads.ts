import { useState, useCallback, useRef } from "react";
import { uploadApi } from "../api/uploadApi";
import type { UploadImage } from "../types";

export function useMyUploads(weddingId: number | null) {
  const [uploads, setUploads] = useState<UploadImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!weddingId || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const { data } = await uploadApi.getMyUploads(weddingId);
      setUploads(data);
    } catch {
      // 에러는 axiosInstance 인터셉터에서 처리
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [weddingId]);

  const removeUpload = useCallback((id: number) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  return { uploads, isLoading, refresh, removeUpload };
}
