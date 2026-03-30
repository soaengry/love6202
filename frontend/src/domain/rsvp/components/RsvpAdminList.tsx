import { useEffect, useRef, type FC } from "react";
import { useInfiniteRsvpList } from "../hooks/useInfiniteRsvpList";
import { RsvpCard } from "./RsvpCard";

interface RsvpAdminListProps {
  weddingId: number;
}

export const RsvpAdminList: FC<RsvpAdminListProps> = ({ weddingId }) => {
  const { items, isLoading, loadMore, refresh, isInitialized } = useInfiniteRsvpList(weddingId);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
        <RsvpCard key={rsvp.id} rsvp={rsvp} />
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
