import { useState, useEffect, useRef, type FC } from "react";
import { IoArrowBackOutline, IoCloudUploadOutline, IoImagesOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuthStore } from "@/domain/auth/store/useAuthStore.ts";
import { MasonryGrid } from "@/domain/gallery/components/MasonryGrid.tsx";
import { ImageViewer } from "@/domain/gallery/components/ImageViewer.tsx";
import { useInfiniteGallery } from "@/domain/gallery/hooks/useInfiniteGallery.ts";
import { galleryApi } from "@/domain/gallery/api/galleryApi.ts";
import { GALLERY_VALIDATION } from "@/domain/gallery/gallery.constants.ts";
import type { TabId } from "@/global/components/BottomNav.tsx";

interface GalleryTabProps {
  weddingId: number;
  setActiveTab: (tab: TabId) => void;
}

export const GalleryTab: FC<GalleryTabProps> = ({ weddingId, setActiveTab }) => {
  const { user } = useAuthStore();
  const { images, isLoading, refresh, removeImage, isInitialized } =
    useInfiniteGallery(weddingId);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHostOrAdmin = user?.role === "ADMIN" || user?.role === "HOST";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > GALLERY_VALIDATION.MAX_UPLOAD_COUNT) {
      toast.error(`최대 ${GALLERY_VALIDATION.MAX_UPLOAD_COUNT}장까지 업로드 가능합니다.`);
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("weddingId", String(weddingId));
      Array.from(files).forEach((file) => formData.append("images", file));
      await galleryApi.upload(formData);
      toast.success("사진이 업로드되었습니다.");
      refresh();
    } catch {
      toast.error("사진 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (id: number) => {
    try {
      await galleryApi.deleteImages([id]);
      removeImage(id);
      toast.success("사진이 삭제되었습니다.");
    } catch {
      toast.error("사진 삭제에 실패했습니다.");
    }
  };

  // 전체 갤러리 초기 로드
  useEffect(() => {
    if (!isInitialized.current) {
      refresh();
    }
  }, [refresh, isInitialized]);

  return (
    <div className="gallery-tab">
      {/* 헤더 */}
      <div className="page-header flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab("info")}
          className="back-button p-2 hover:bg-bg-primary rounded-full transition-colors cursor-pointer"
        >
          <IoArrowBackOutline className="text-xl text-text-primary" />
        </button>
        <h1 className="page-title text-xl font-semibold text-text-primary flex-1">
          갤러리
        </h1>
        {isHostOrAdmin && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={GALLERY_VALIDATION.ACCEPTED_TYPES.join(",")}
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gallery-upload-button p-2 hover:bg-bg-primary rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <IoCloudUploadOutline className="text-xl text-text-primary" />
              )}
            </button>
          </>
        )}
      </div>

      {/* 갤러리 콘텐츠 */}
      {isLoading ? (
        <div className="gallery-loading flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <div className="gallery-empty text-center py-16">
          <IoImagesOutline className="text-5xl text-text-secondary mx-auto mb-4" />
          <p className="text-sm text-text-secondary">아직 사진이 없습니다.</p>
        </div>
      ) : (
        <MasonryGrid
          images={images}
          onImageClick={(index) => setViewerIndex(index)}
        />
      )}

      {/* 이미지 뷰어 */}
      {viewerIndex !== null && (
        <ImageViewer
          images={images}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onDelete={isHostOrAdmin ? handleDeleteImage : undefined}
        />
      )}
    </div>
  );
};
