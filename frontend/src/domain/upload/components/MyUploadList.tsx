import { useState, useEffect, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoTrashOutline, IoImageOutline, IoCheckmarkCircle, IoEllipseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { uploadApi } from "../api/uploadApi";
import { useMyUploads } from "../hooks/useMyUploads";

interface MyUploadListProps {
  weddingId: number;
  refreshKey: number;
}

export const MyUploadList: FC<MyUploadListProps> = ({ weddingId, refreshKey }) => {
  const { uploads, isLoading, refresh, removeUpload } = useMyUploads(weddingId);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exitSelection = () => {
    setSelectedIds(new Set());
    setIsSelecting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 사진을 삭제하시겠습니까?")) return;
    try {
      await uploadApi.deleteImage(id);
      removeUpload(id);
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.size || isDeleting) return;
    if (!confirm(`선택한 ${selectedIds.size}장을 삭제하시겠습니까?`)) return;

    setIsDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => uploadApi.deleteImage(id)));
      [...selectedIds].forEach(removeUpload);
      toast.success(`${selectedIds.size}장 삭제되었습니다.`);
      exitSelection();
    } catch {
      toast.error("삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && uploads.length === 0) {
    return (
      <div className="upload-list-loading flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="upload-list-empty text-center py-12">
        <IoImageOutline className="text-4xl text-text-tertiary mx-auto mb-3" />
        <p className="text-sm text-text-secondary">아직 업로드한 사진이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="my-upload-list">
      <div className="upload-list-header flex items-center justify-between mb-3">
        <p className="upload-count text-sm text-text-secondary">
          {isSelecting ? `${selectedIds.size}장 선택됨` : `내가 올린 사진 ${uploads.length}장`}
        </p>
        <div className="upload-actions flex items-center gap-2">
          {isSelecting ? (
            <>
              <button
                type="button"
                onClick={exitSelection}
                className="select-cancel-button text-xs text-text-secondary px-3 py-1.5 rounded-lg border border-border hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                disabled={!selectedIds.size || isDeleting}
                className="batch-delete-button text-xs text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsSelecting(true)}
              className="select-button text-xs text-text-secondary px-3 py-1.5 rounded-lg border border-border hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              여러 개 선택
            </button>
          )}
        </div>
      </div>

      <div className="upload-grid grid grid-cols-3 gap-2">
        <AnimatePresence>
          {uploads.map((upload) => {
            const isSelected = selectedIds.has(upload.id);
            return (
              <motion.div
                key={upload.id}
                className={`upload-item relative aspect-square rounded-lg overflow-hidden group cursor-pointer ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => isSelecting && toggleSelect(upload.id)}
              >
                <img
                  src={upload.thumbnailUrl ?? upload.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {isSelecting && (
                  <div
                    className={`select-overlay absolute inset-0 transition-colors ${
                      isSelected ? "bg-primary/20" : "bg-transparent"
                    }`}
                  >
                    <div className="absolute top-1.5 left-1.5 text-xl">
                      {isSelected
                        ? <IoCheckmarkCircle className="text-primary drop-shadow" />
                        : <IoEllipseOutline className="text-white drop-shadow" />}
                    </div>
                  </div>
                )}

                {!isSelecting && (
                  <button
                    type="button"
                    onClick={() => handleDelete(upload.id)}
                    className="delete-button absolute top-1.5 right-1.5 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <IoTrashOutline className="text-sm" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
