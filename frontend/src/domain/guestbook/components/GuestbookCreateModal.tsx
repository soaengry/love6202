import { useState, useEffect, type FC } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuthStore } from "@/domain/auth/store/useAuthStore.ts";
import { guestbookApi } from "../api/guestbookApi";
import {
  GUESTBOOK_VALIDATION,
  GUESTBOOK_TYPES,
  GUESTBOOK_BG_BASE_URL,
} from "../guestbook.constants";
import type { GuestbookEntry } from "../types";

interface GuestbookCreateModalProps {
  weddingId: number;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (entry: GuestbookEntry) => void;
}

export const GuestbookCreateModal: FC<GuestbookCreateModalProps> = ({
  weddingId,
  isOpen,
  onClose,
  onCreated,
}) => {
  const { user } = useAuthStore();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (isOpen && user?.nickname && !name) {
      setName(user.nickname);
    }
  }, [isOpen, user?.nickname]);
  const [selectedType, setSelectedType] = useState<
    (typeof GUESTBOOK_TYPES)[number]
  >(GUESTBOOK_TYPES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) {
      toast.error("이름과 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await guestbookApi.create({
        weddingId,
        name: name.trim(),
        content: content.trim(),
        type: selectedType,
      });
      onCreated(data);
      toast.success("방명록이 등록되었습니다.");
      setName("");
      setContent("");
      setSelectedType(GUESTBOOK_TYPES[0]);
      onClose();
    } catch {
      toast.error("방명록 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="guestbook-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="guestbook-modal-content bg-surface rounded-2xl w-[90%] max-w-md mx-4 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="modal-header flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="modal-title text-lg font-semibold text-text-primary">
                방명록 작성
              </h2>
              <button
                className="close-button p-1 hover:bg-bg-primary rounded-full transition-colors cursor-pointer"
                onClick={onClose}
              >
                <IoCloseOutline className="text-xl text-text-secondary" />
              </button>
            </div>

            {/* 본문 */}
            <div className="modal-body px-5 py-4 space-y-4">
              {/* 이름 입력 */}
              <div className="name-field">
                <label className="field-label block text-sm font-medium text-text-primary mb-1">
                  이름
                </label>
                <input
                  type="text"
                  className="name-input w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="이름을 입력해주세요"
                  maxLength={GUESTBOOK_VALIDATION.MAX_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* 내용 입력 */}
              <div className="content-field">
                <label className="field-label block text-sm font-medium text-text-primary mb-1">
                  내용
                </label>
                <textarea
                  className="content-input w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm resize-none focus:outline-none focus:border-primary transition-colors"
                  placeholder="축하 메시지를 남겨주세요"
                  rows={4}
                  maxLength={GUESTBOOK_VALIDATION.MAX_CONTENT_LENGTH}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <p className="char-count text-xs text-text-tertiary text-right mt-1">
                  {content.length}/{GUESTBOOK_VALIDATION.MAX_CONTENT_LENGTH}
                </p>
              </div>

              {/* 배경 선택 */}
              <div className="type-field">
                <label className="field-label block text-sm font-medium text-text-primary mb-2">
                  배경 선택
                </label>
                <div className="type-list flex gap-2 overflow-x-auto pb-2">
                  {GUESTBOOK_TYPES.map((type) => (
                    <button
                      key={type}
                      className={`type-option shrink-0 rounded-md overflow-hidden cursor-pointer transition-all ${
                        selectedType === type
                          ? "ring-2 ring-primary ring-offset-1"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      onClick={() => setSelectedType(type)}
                    >
                      <img
                        src={`${GUESTBOOK_BG_BASE_URL}/${type}.png`}
                        alt={type}
                        className="type-preview h-8 w-auto block"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="modal-footer px-5 py-4 border-t border-border">
              <button
                className="submit-button w-full py-3 rounded-xl font-medium text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
                onClick={handleSubmit}
                disabled={isSubmitting || !name.trim() || !content.trim()}
              >
                {isSubmitting ? "등록 중..." : "작성 완료"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
