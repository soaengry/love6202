import { useEffect, useRef, useState, type FC } from "react";
import { toast } from "react-toastify";
import { useInfiniteRsvpList } from "../hooks/useInfiniteRsvpList";
import { RsvpCard } from "./RsvpCard";
import { rsvpApi } from "../api/rsvpApi";
import type { RsvpResponse } from "../types";

interface RsvpAdminListProps {
  weddingId: number;
}

export const RsvpAdminList: FC<RsvpAdminListProps> = ({ weddingId }) => {
  const { items, isLoading, loadMore, refresh, isInitialized } = useInfiniteRsvpList(weddingId);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isInitialized.current) {
      refresh();
    }
  }, [refresh, isInitialized]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleDelete = async (rsvp: RsvpResponse) => {
    if (!window.confirm(`${rsvp.name}님의 참석 의향서를 삭제하시겠습니까?`)) return;
    setDeletingId(rsvp.id);
    try {
      await rsvpApi.remove(rsvp.id);
      toast.success("삭제되었습니다");
      refresh();
    } catch {
      toast.error("삭제에 실패했습니다");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isLoading && items.length === 0) {
    return (
      <div className="rsvp-empty text-center py-12 text-text-tertiary text-sm">
        아직 접수된 참석 의향서가 없습니다
      </div>
    );
  }

  return (
    <div className="rsvp-admin-list space-y-3">
      {items.map((rsvp) => (
        <RsvpCard
          key={rsvp.id}
          rsvp={rsvp}
          onDelete={deletingId === rsvp.id ? undefined : () => handleDelete(rsvp)}
        />
      ))}
      <div ref={sentinelRef} />
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
