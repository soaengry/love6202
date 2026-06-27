import { useState, useCallback, useEffect, type FC } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloseOutline, IoTrashOutline, IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import type { GalleryImage } from "../types";

interface ImageViewerProps {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (id: number) => void;
}

const SWIPE_THRESHOLD = 50;

export const ImageViewer: FC<ImageViewerProps> = ({
  images,
  initialIndex,
  onClose,
  onDelete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [direction, setDirection] = useState(0);

  const current = images[currentIndex];

  const goTo = useCallback(
    (newIndex: number, dir: number) => {
      if (newIndex >= 0 && newIndex < images.length) {
        setDirection(dir);
        setCurrentIndex(newIndex);
      }
    },
    [images.length],
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setDragOffsetX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setDragOffsetX(e.touches[0].clientX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;

    if (dragOffsetX < -SWIPE_THRESHOLD) {
      goTo(currentIndex + 1, 1);
    } else if (dragOffsetX > SWIPE_THRESHOLD) {
      goTo(currentIndex - 1, -1);
    }

    setTouchStartX(null);
    setDragOffsetX(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(currentIndex + 1, 1);
      else if (e.key === "ArrowLeft") goTo(currentIndex - 1, -1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, goTo, onClose]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="image-viewer fixed inset-0 z-[9999] bg-black/95 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* 상단 바 */}
        <div className="image-viewer-header flex items-center justify-between px-4 py-3">
          <button
            onClick={onClose}
            className="close-button p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <IoCloseOutline className="text-2xl" />
          </button>
          <span className="image-counter text-sm text-white/70">
            {currentIndex + 1} / {images.length}
          </span>
          {onDelete ? (
            <button
              onClick={() => {
                if (!window.confirm("삭제하시겠습니까?")) return;
                const id = current.id;
                // 다음 이미지로 이동하거나 닫기
                if (images.length <= 1) {
                  onDelete(id);
                  onClose();
                } else {
                  const nextIndex = currentIndex >= images.length - 1 ? currentIndex - 1 : currentIndex;
                  onDelete(id);
                  setCurrentIndex(Math.max(0, nextIndex));
                }
              }}
              className="delete-button p-2 text-white/80 hover:text-red-400 transition-colors cursor-pointer"
            >
              <IoTrashOutline className="text-2xl" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* 이미지 영역 */}
        <div
          className="image-viewer-body relative flex-1 flex items-center justify-center overflow-hidden"
          style={{ touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 이전 화살표 */}
          {currentIndex > 0 && (
            <button
              onClick={() => goTo(currentIndex - 1, -1)}
              className="prev-button absolute left-2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors cursor-pointer"
            >
              <IoChevronBackOutline size={28} />
            </button>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.id}
              className="image-viewer-slide relative w-full h-full flex items-center justify-center px-14"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{
                transform: touchStartX !== null ? `translateX(${dragOffsetX}px)` : undefined,
              }}
            >
              {/* 이미지 보호 오버레이 */}
              <div className="image-protect absolute inset-0 z-10" />
              <img
                src={current.imageUrl}
                alt={current.caption ?? "갤러리 이미지"}
                className="gallery-image max-w-full max-h-full object-contain"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>

          {/* 다음 화살표 */}
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => goTo(currentIndex + 1, 1)}
              className="next-button absolute right-2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors cursor-pointer"
            >
              <IoChevronForwardOutline size={28} />
            </button>
          )}
        </div>

        {/* 인디케이터 dots (최대 10개 표시) */}
        {images.length <= 10 && (
          <div className="image-viewer-dots flex items-center justify-center gap-1.5 py-4">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};
