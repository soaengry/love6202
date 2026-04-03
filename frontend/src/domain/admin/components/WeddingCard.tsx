import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { IoEyeOutline, IoCreateOutline } from "react-icons/io5";
import type { AdminWeddingListItem } from "../types.ts";

interface WeddingCardProps {
  wedding: AdminWeddingListItem;
}

export const WeddingCard: FC<WeddingCardProps> = ({ wedding }) => {
  const navigate = useNavigate();

  const dateStr = new Date(wedding.weddingDate).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="wedding-card bg-bg-primary rounded-xl border border-border p-4">
      <div className="wedding-card-info mb-3">
        <h3 className="wedding-card-title text-sm font-semibold text-text-primary truncate">
          {wedding.title}
        </h3>
        <p className="wedding-card-couple text-xs text-primary font-medium mt-0.5">
          {wedding.coupleNames}
        </p>
        <p className="wedding-card-meta text-xs text-text-secondary mt-1">
          {dateStr} · {wedding.venueName}
        </p>
      </div>
      <div className="wedding-card-actions flex gap-2">
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
