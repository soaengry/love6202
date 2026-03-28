import { useEffect, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoTrashOutline, IoImageOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { uploadApi } from "../api/uploadApi";
import { useMyUploads } from "../hooks/useMyUploads";

interface MyUploadListProps {
  weddingId: number;
  refreshKey: number;
}

export const MyUploadList: FC<MyUploadListProps> = ({
  weddingId,
  refreshKey,
}) => {
  const { uploads, isLoading, refresh, removeUpload } = useMyUploads(weddingId);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

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
        <p className="text-sm text-text-secondary">
          아직 업로드한 사진이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="my-upload-list">
      <p className="upload-count text-sm text-text-secondary mb-3">
        내가 올린 사진 {uploads.length}장
      </p>
      <div className="upload-grid grid grid-cols-3 gap-2">
        <AnimatePresence>
          {uploads.map((upload) => (
            <motion.div
              key={upload.id}
              className="upload-item relative aspect-square rounded-lg overflow-hidden group"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src={upload.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => handleDelete(upload.id)}
                className="delete-button absolute top-1.5 right-1.5 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <IoTrashOutline className="text-sm" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
