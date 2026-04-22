import { useState, useEffect } from "react";
import { adminApi } from "@/domain/admin/api/adminApi.ts";
import type { AdminWeddingListItem } from "@/domain/admin/types.ts";

export function useAdminWeddings(enabled: boolean): AdminWeddingListItem[] {
  const [adminWeddings, setAdminWeddings] = useState<AdminWeddingListItem[]>([]);

  useEffect(() => {
    if (!enabled) return;
    adminApi.getWeddings().then((res) => setAdminWeddings(res.data)).catch(() => {});
  }, [enabled]);

  return adminWeddings;
}
