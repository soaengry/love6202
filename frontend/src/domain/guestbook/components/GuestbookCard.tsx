import { type FC } from "react";
import { motion } from "framer-motion";
import { IoCloseOutline } from "react-icons/io5";
import { GUESTBOOK_BG_BASE_URL } from "../guestbook.constants";
import type { GuestbookEntry } from "../types";

interface GuestbookCardProps {
  entry: GuestbookEntry;
  index: number;
  canDelete: boolean;
  onDelete: (id: number) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${month}.${day} ${hours}:${minutes}`;
}

export const GuestbookCard: FC<GuestbookCardProps> = ({
  entry,
  index,
  canDelete,
  onDelete,
}) => {
  const bgUrl = `${GUESTBOOK_BG_BASE_URL}/${entry.type}.png`;

  return (
    <motion.div
      className="guestbook-card relative mb-3"
      initial={{ opacity: 0, scale: 0.95, rotate: entry.rotation }}
      animate={{ opacity: 1, scale: 1, rotate: entry.rotation }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {/* 배경 이미지 */}
      <img
        src={bgUrl}
        alt=""
        className="guestbook-bg w-full h-auto block rounded-lg"
        draggable={false}
      />

      {/* 텍스트 오버레이 */}
      <div className="guestbook-card-content absolute inset-0 flex flex-col justify-center p-6 pt-16">
        {canDelete && (
          <button
            className="delete-button absolute top-2 right-2 p-1 rounded-full hover:bg-black/20 transition-colors cursor-pointer"
            onClick={() => onDelete(entry.id)}
          >
            <IoCloseOutline className="text-white text-sm" />
          </button>
        )}
        <p className="guestbook-content text-sm text-gray-800 whitespace-pre-wrap wrap-break-word mb-2">
          {entry.content}
        </p>
        <p className="guestbook-date text-[10px] text-gray-500 text-right mt-1">
          {formatDate(entry.createdAt)}
        </p>
        <p className="guestbook-name text-xs text-gray-600 text-right">
          {entry.name}
        </p>
      </div>
    </motion.div>
  );
};
