import { useState, type FC } from "react";
import { IoArrowBackOutline } from "react-icons/io5";
import { UploadForm } from "@/domain/upload/components/UploadForm.tsx";
import { MyUploadList } from "@/domain/upload/components/MyUploadList.tsx";
import type { TabId } from "@/global/components/BottomNav.tsx";

interface UploadTabProps {
  weddingId: number;
  setActiveTab: (tab: TabId) => void;
}

export const UploadTab: FC<UploadTabProps> = ({ weddingId, setActiveTab }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="upload-tab">
      {/* 헤더 */}
      <div className="page-header flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab("gallery")}
          className="back-button p-2 hover:bg-bg-primary rounded-full transition-colors cursor-pointer"
        >
          <IoArrowBackOutline className="text-xl text-text-primary" />
        </button>
        <h1 className="page-title text-xl font-semibold text-text-primary flex-1">
          사진 업로드
        </h1>
      </div>

      {/* 업로드 폼 */}
      <UploadForm weddingId={weddingId} onUploadComplete={handleUploadComplete} />

      {/* 구분선 */}
      <hr className="my-6 border-border" />

      {/* 내 업로드 목록 */}
      <MyUploadList weddingId={weddingId} refreshKey={refreshKey} />
    </div>
  );
};
