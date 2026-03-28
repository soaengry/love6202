import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { ENV } from "@/global/config/env.ts";
import { GUESTBOOK_API } from "../guestbook.constants";
import type { GuestbookEntry } from "../types";

interface UseGuestbookSSEOptions {
  weddingId: number;
  enabled: boolean;
  onNewEntry: (entry: GuestbookEntry) => void;
}

export function useGuestbookSSE({ weddingId, enabled, onNewEntry }: UseGuestbookSSEOptions) {
  const onNewEntryRef = useRef(onNewEntry);
  onNewEntryRef.current = onNewEntry;

  useEffect(() => {
    if (!enabled || !weddingId) return;

    const url = `${ENV.API_BASE_URL}/api${GUESTBOOK_API.SUBSCRIBE}?weddingId=${weddingId}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const entry: GuestbookEntry = JSON.parse(event.data);
        onNewEntryRef.current(entry);
        toast.info(`${entry.name}님이 방명록을 남겼습니다.`, {
          autoClose: 3000,
        });
      } catch {
        // 파싱 실패 무시
      }
    };

    eventSource.onerror = () => {
      // EventSource는 자동 재연결함 — 별도 처리 불필요
    };

    return () => {
      eventSource.close();
    };
  }, [weddingId, enabled]);
}
