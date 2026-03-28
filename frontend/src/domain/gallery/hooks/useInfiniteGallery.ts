import { useState, useCallback, useRef } from "react";
import { galleryApi } from "../api/galleryApi";
import type { GalleryImage } from "../types";

export function useInfiniteGallery(weddingId: number | null) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const pageRef = useRef(0);
  const hasNextRef = useRef(true);
  const isLoadingRef = useRef(false);
  const isInitialized = useRef(false);
  const weddingIdRef = useRef(weddingId);
  weddingIdRef.current = weddingId;

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasNextRef.current || !weddingIdRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const { data } = await galleryApi.getList(weddingIdRef.current, pageRef.current);
      setImages((prev) => [...prev, ...data.items]);
      hasNextRef.current = data.hasNext;
      setTotalCount(data.totalCount);
      pageRef.current += 1;
    } catch {
      // 에러는 axiosInstance 인터셉터에서 처리
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!weddingIdRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const { data } = await galleryApi.getList(weddingIdRef.current, 0);
      setImages(data.items);
      hasNextRef.current = data.hasNext;
      setTotalCount(data.totalCount);
      pageRef.current = 1;
      isInitialized.current = true;
    } catch {
      // 에러는 axiosInstance 인터셉터에서 처리
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const removeImage = useCallback((id: number) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setTotalCount((prev) => prev - 1);
  }, []);

  return {
    images,
    isLoading,
    hasNext: hasNextRef.current,
    totalCount,
    loadMore,
    refresh,
    removeImage,
    isInitialized,
  };
}
