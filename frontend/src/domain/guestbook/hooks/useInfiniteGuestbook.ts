import { useState, useCallback, useRef } from "react";
import { guestbookApi } from "../api/guestbookApi";
import type { GuestbookEntry } from "../types";

export function useInfiniteGuestbook(weddingId: number | null) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
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
      const { data } = await guestbookApi.getList(weddingIdRef.current, pageRef.current);
      setEntries((prev) => [...prev, ...data.items]);
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
      const { data } = await guestbookApi.getList(weddingIdRef.current, 0);
      setEntries(data.items);
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

  const removeEntry = useCallback((id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setTotalCount((prev) => prev - 1);
  }, []);

  const prependEntry = useCallback((entry: GuestbookEntry) => {
    setEntries((prev) => {
      // 중복 방지 (모달 onCreated + SSE 동시 수신 시)
      if (prev.some((e) => e.id === entry.id)) return prev;
      return [entry, ...prev];
    });
    setTotalCount((prev) => prev + 1);
  }, []);

  return {
    entries,
    isLoading,
    hasNext: hasNextRef.current,
    totalCount,
    loadMore,
    refresh,
    removeEntry,
    prependEntry,
    isInitialized,
  };
}
