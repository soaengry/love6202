import { useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { IoEyeOutline, IoCreateOutline, IoPinOutline, IoPin } from "react-icons/io5";
import { toast } from "react-toastify";
import { adminApi } from "../api/adminApi.ts";
import type { AdminWeddingListItem } from "../types.ts";

interface WeddingCardProps {
  wedding: AdminWeddingListItem;
  onPinChange?: (updated: AdminWeddingListItem) => void;
}

export const WeddingCard: FC<WeddingCardProps> = ({ wedding, onPinChange }) => {
  const navigate = useNavigate();
  const [isPinning, setIsPinning] = useState(false);

  const dateStr = new Date(wedding.weddingDate).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePin = async () => {
    setIsPinning(true);
    try {
      const { data: updated } = await adminApi.pinWedding(wedding.id);
      onPinChange?.(updated);
      toast.success(updated.isPinned ? "메인에 고정되었습니다." : "고정이 해제되었습니다.");
    } catch {
      toast.error("고정 설정에 실패했습니다.");
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <div className={`wedding-card bg-bg-primary rounded-xl border p-4 transition-colors ${wedding.isPinned ? "border-primary" : "border-border"}`}>
      <div className="wedding-card-info mb-3">
        <div className="flex items-center gap-2 mb-0.5">
          {wedding.isPinned && (
            <span className="wedding-card-pin-badge inline-flex items-center gap-0.5 text-[10px] font-semibold text-white bg-primary rounded-full px-2 py-0.5">
              <IoPin className="text-xs" />
              메인 고정
            </span>
          )}
          <h3 className="wedding-card-title text-sm font-semibold text-text-primary truncate">
            {wedding.title}
          </h3>
        </div>
        <p className="wedding-card-couple text-xs text-primary font-medium mt-0.5">
          {wedding.coupleNames}
        </p>
        <p className="wedding-card-meta text-xs text-text-secondary mt-1">
          {dateStr} · {wedding.venueName}
        </p>
      </div>
      <div className="wedding-card-actions flex gap-2">
        {onPinChange && (
          <button
            onClick={handlePin}
            disabled={isPinning}
            className={`wedding-card-pin flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
              wedding.isPinned
                ? "text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10"
                : "text-text-secondary border border-border hover:bg-bg-secondary"
            }`}
          >
            {wedding.isPinned ? <IoPin className="text-sm" /> : <IoPinOutline className="text-sm" />}
            {wedding.isPinned ? "고정 해제" : "메인 고정"}
          </button>
        )}
        <button
          onClick={() => navigate(`/${wedding.id}`)}
          className="wedding-card-view flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
        >
          <IoEyeOutline className="text-sm" />
          보기
        </button>
        <button
          onClick={() => navigate(`/edit?weddingId=${wedding.id}`)}
          className="wedding-card-edit flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <IoCreateOutline className="text-sm" />
          수정
        </button>
      </div>
    </div>
  );
};
