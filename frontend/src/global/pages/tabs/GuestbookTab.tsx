import { useState, useEffect, useRef, type FC } from "react";
import { IoArrowBackOutline, IoChatbubbleEllipsesOutline, IoCreateOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuthStore } from "@/domain/auth/store/useAuthStore.ts";
import { GuestbookMasonry } from "@/domain/guestbook/components/GuestbookMasonry.tsx";
import { GuestbookCreateModal } from "@/domain/guestbook/components/GuestbookCreateModal.tsx";
import { useInfiniteGuestbook } from "@/domain/guestbook/hooks/useInfiniteGuestbook.ts";
import { useGuestbookSSE } from "@/domain/guestbook/hooks/useGuestbookSSE.ts";
import { guestbookApi } from "@/domain/guestbook/api/guestbookApi.ts";
import type { TabId } from "@/global/components/BottomNav.tsx";

interface GuestbookTabProps {
  weddingId: number;
  setActiveTab: (tab: TabId) => void;
}

export const GuestbookTab: FC<GuestbookTabProps> = ({ weddingId, setActiveTab }) => {
  const { user } = useAuthStore();
  const {
    entries, isLoading, loadMore, refresh, removeEntry, prependEntry, isInitialized,
  } = useInfiniteGuestbook(weddingId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isHostOrAdmin = user?.role === "ADMIN" || user?.role === "HOST";

  // SSE 알림 (ADMIN/HOST만)
  useGuestbookSSE({
    weddingId,
    enabled: isHostOrAdmin,
    onNewEntry: prependEntry,
  });

  // 초기 로드
  useEffect(() => {
    if (!isInitialized.current) {
      refresh();
    }
  }, [refresh, isInitialized]);

  // Intersection Observer for infinite scroll
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("삭제하시겠습니까?")) return;

    try {
      await guestbookApi.remove(id);
      removeEntry(id);
      toast.success("방명록이 삭제되었습니다.");
    } catch {
      toast.error("방명록 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="guestbook-tab">
      {/* 헤더 */}
      <div className="page-header flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab("info")}
          className="back-button p-2 hover:bg-bg-primary rounded-full transition-colors cursor-pointer"
        >
          <IoArrowBackOutline className="text-xl text-text-primary" />
        </button>
        <h1 className="page-title text-xl font-semibold text-text-primary flex-1">
          방명록
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="write-button p-2 hover:bg-bg-primary rounded-full transition-colors cursor-pointer"
        >
          <IoCreateOutline className="text-xl text-text-primary" />
        </button>
      </div>

      {/* 방명록 콘텐츠 */}
      {entries.length === 0 && !isLoading ? (
        <div className="guestbook-empty text-center py-16">
          <IoChatbubbleEllipsesOutline className="text-5xl text-text-secondary mx-auto mb-4" />
          <p className="text-sm text-text-secondary">아직 방명록이 없습니다.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="write-cta mt-4 text-sm text-primary font-medium hover:underline cursor-pointer"
          >
            첫 번째 방명록을 남겨보세요
          </button>
        </div>
      ) : (
        <GuestbookMasonry
          entries={entries}
          canDelete={isHostOrAdmin}
          onDelete={handleDelete}
        />
      )}

      {/* 로딩 스피너 */}
      {isLoading && (
        <div className="guestbook-loading flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 무한 스크롤 sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* 작성 모달 */}
      <GuestbookCreateModal
        weddingId={weddingId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={prependEntry}
      />
    </div>
  );
};
