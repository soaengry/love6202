import { useState, useEffect, useRef, type FC } from "react";
import { motion } from "framer-motion";
import { IoDownloadOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/domain/auth/store/useAuthStore";
import { rsvpApi } from "@/domain/rsvp/api/rsvpApi";
import { RsvpForm } from "@/domain/rsvp/components/RsvpForm";
import { RsvpCard } from "@/domain/rsvp/components/RsvpCard";
import { RsvpStatsPanel } from "@/domain/rsvp/components/RsvpStatsPanel";
import { RsvpAdminList } from "@/domain/rsvp/components/RsvpAdminList";
import type { RsvpResponse, RsvpStatsResponse } from "@/domain/rsvp/types";

interface RsvpTabProps {
  weddingId: number;
}

const slideUpAnim = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
} as const;

// ─── Admin View ───────────────────────────────────────────────

const AdminView: FC<{ weddingId: number }> = ({ weddingId }) => {
  const [stats, setStats] = useState<RsvpStatsResponse | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    rsvpApi
      .getStats(weddingId)
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, [weddingId]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await rsvpApi.exportCsv(weddingId);
      const blob = new Blob([response.data as BlobPart], { type: "text/csv; charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = downloadLinkRef.current!;
      link.href = url;
      link.download = `rsvp_${weddingId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("내보내기에 실패했습니다");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      {...slideUpAnim}
      className="rsvp-admin-view space-y-6"
    >
      {/* 숨겨진 다운로드 링크 */}
      <a ref={downloadLinkRef} className="hidden" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.4em] text-primary/40 uppercase font-medium">R.S.V.P</p>
          <p className="text-sm font-semibold text-text-primary mt-1">참석 현황</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="export-btn flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors cursor-pointer"
        >
          <IoDownloadOutline size={14} />
          {isExporting ? "내보내는 중..." : "내보내기"}
        </button>
      </div>

      {stats && <RsvpStatsPanel stats={stats} />}

      <div className="border-t border-border-light pt-4">
        <p className="text-xs font-semibold text-text-secondary mb-3">접수 목록</p>
        <RsvpAdminList weddingId={weddingId} />
      </div>
    </motion.div>
  );
};

// ─── Guest View ───────────────────────────────────────────────

const GuestView: FC<{ weddingId: number }> = ({ weddingId }) => {
  // undefined = 로딩 중, null = RSVP 없음, RsvpResponse = 존재
  const [myRsvp, setMyRsvp] = useState<RsvpResponse | null | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    rsvpApi
      .getMyRsvp(weddingId)
      .then(({ data }) => setMyRsvp(data ?? null))
      .catch((err) => {
        if (isAxiosError(err) && err.response?.status === 404) {
          setMyRsvp(null);
        } else {
          setMyRsvp(null);
        }
      });
  }, [weddingId]);

  const handleCancel = async () => {
    if (!myRsvp) return;
    if (!window.confirm("참석 의향서를 취소하시겠습니까?")) return;
    setIsCancelling(true);
    try {
      await rsvpApi.remove(myRsvp.id);
      setMyRsvp(null);
      toast.success("참석 의향서가 취소되었습니다");
    } catch {
      toast.error("취소에 실패했습니다");
    } finally {
      setIsCancelling(false);
    }
  };

  // 로딩 중
  if (myRsvp === undefined) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 폼 표시 (신규 or 수정)
  if (showForm || isEditing) {
    return (
      <motion.div {...slideUpAnim}>
        <p className="text-[10px] tracking-[0.4em] text-primary/40 uppercase font-medium mb-6">
          R.S.V.P
        </p>
        <p className="text-sm font-semibold text-text-primary mb-6">
          {isEditing ? "참석 의향서 수정" : "참석 의향서 작성"}
        </p>
        <RsvpForm
          weddingId={weddingId}
          existingRsvp={isEditing ? myRsvp! : undefined}
          onSuccess={(data) => {
            setMyRsvp(data);
            setShowForm(false);
            setIsEditing(false);
          }}
          onCancel={() => {
            setShowForm(false);
            setIsEditing(false);
          }}
        />
      </motion.div>
    );
  }

  // RSVP가 없는 경우 - CTA
  if (!myRsvp) {
    return (
      <motion.div {...slideUpAnim} className="text-center py-12">
        <p className="text-[10px] tracking-[0.4em] text-primary/40 uppercase font-medium mb-8">
          R.S.V.P
        </p>
        <div className="mb-8">
          <p className="text-base font-semibold text-text-primary mb-2">
            참석 여부를 알려주세요
          </p>
          <p className="text-sm text-text-secondary">
            소중한 날을 함께할 수 있도록 참석 의사를 전달해주세요
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rsvp-cta-btn inline-flex items-center justify-center px-8 py-3.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
        >
          참석 의사 전달하기
        </button>
      </motion.div>
    );
  }

  // RSVP가 있는 경우 - 조회 + 수정/취소
  return (
    <motion.div {...slideUpAnim} className="space-y-4">
      <p className="text-[10px] tracking-[0.4em] text-primary/40 uppercase font-medium mb-6">
        R.S.V.P
      </p>
      <p className="text-sm font-semibold text-text-primary">내가 작성한 참석 의향서</p>
      <RsvpCard rsvp={myRsvp} />
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setIsEditing(true)}
          className="edit-btn flex-1 py-3 rounded-xl border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors cursor-pointer"
        >
          수정하기
        </button>
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="cancel-rsvp-btn flex-1 py-3 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isCancelling ? "취소 중..." : "참석 취소"}
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main RsvpTab ─────────────────────────────────────────────

export const RsvpTab: FC<RsvpTabProps> = ({ weddingId }) => {
  const { user } = useAuthStore();
  const isAdminOrHost = user?.role === "ADMIN" || user?.role === "HOST";

  return (
    <div className="rsvp-tab py-4">
      {isAdminOrHost ? (
        <AdminView weddingId={weddingId} />
      ) : (
        <GuestView weddingId={weddingId} />
      )}
    </div>
  );
};
