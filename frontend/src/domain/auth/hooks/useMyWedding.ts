import { useState, useEffect } from "react";
import { weddingApi } from "@/domain/wedding/api/weddingApi.ts";
import type { AdminWeddingListItem } from "@/domain/admin/types.ts";

interface UseMyWeddingResult {
  myWedding: AdminWeddingListItem | null;
  hasWedding: boolean | null;
}

export function useMyWedding(): UseMyWeddingResult {
  const [myWedding, setMyWedding] = useState<AdminWeddingListItem | null>(null);
  const [hasWedding, setHasWedding] = useState<boolean | null>(null);

  useEffect(() => {
    weddingApi
      .getMyWedding()
      .then((res) => {
        if (!res.data) {
          setHasWedding(false);
          return;
        }
        const w = res.data.wedding;
        const couples = res.data.couples ?? [];
        const coupleNames = couples
          .sort((a: { role: string }) => (a.role === "GROOM" ? -1 : 1))
          .map((c: { name: string }) => c.name)
          .join(" & ");
        setMyWedding({ id: w.id, title: w.title, weddingDate: w.weddingDate, venueName: w.venueName, coupleNames, createdAt: w.createdAt });
        setHasWedding(true);
      })
      .catch(() => setHasWedding(false));
  }, []);

  return { myWedding, hasWedding };
}
