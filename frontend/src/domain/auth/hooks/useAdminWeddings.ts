import { useState, useEffect } from "react";
import { adminApi } from "@/domain/admin/api/adminApi.ts";
import type { AdminWeddingListItem } from "@/domain/admin/types.ts";

export function useAdminWeddings(enabled: boolean) {
  const [adminWeddings, setAdminWeddings] = useState<AdminWeddingListItem[]>([]);

  useEffect(() => {
    if (!enabled) return;
    adminApi.getWeddings().then((res) => setAdminWeddings(res.data)).catch(() => {});
  }, [enabled]);

  const updateWedding = (updated: AdminWeddingListItem) => {
    setAdminWeddings((prev) =>
      prev.map((w) => {
        if (w.id === updated.id) return updated;
        // 다른 항목이 pinned 였다면 해제 처리
        if (updated.isPinned && w.isPinned) return { ...w, isPinned: false };
        return w;
      }),
    );
  };

  return { adminWeddings, updateWedding };
}
