import { useState, useCallback, useRef } from "react";
import { rsvpApi } from "../api/rsvpApi";
import type { RsvpResponse } from "../types";

export function useInfiniteRsvpList(weddingId: number) {
  const [items, setItems] = useState<RsvpResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const pageRef = useRef(0);
  const hasNextRef = useRef(true);
  const isLoadingRef = useRef(false);
  const isInitialized = useRef(false);
  const weddingIdRef = useRef(weddingId);
  weddingIdRef.current = weddingId;

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasNextRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const { data } = await rsvpApi.getList(weddingIdRef.current, pageRef.current);
      setItems((prev) => [...prev, ...data.items]);
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
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const { data } = await rsvpApi.getList(weddingIdRef.current, 0);
      setItems(data.items);
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

  return {
    items,
    isLoading,
    hasNext: hasNextRef.current,
    totalCount,
    loadMore,
    refresh,
    isInitialized,
  };
}
