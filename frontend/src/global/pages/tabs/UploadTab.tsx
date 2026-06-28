import { useState, type FC } from "react";
import { IoArrowBackOutline, IoQrCodeOutline, IoCloseOutline, IoDownloadOutline, IoNotificationsOutline } from "react-icons/io5";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { UploadForm } from "@/domain/upload/components/UploadForm.tsx";
import { MyUploadList } from "@/domain/upload/components/MyUploadList.tsx";
import type { TabId } from "@/global/components/BottomNav.tsx";

interface UploadTabProps {
  weddingId: number;
  setActiveTab: (tab: TabId) => void;
}

const QrModal: FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
  const handleDownload = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "wedding-upload-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      className="qr-modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="qr-modal bg-bg-primary rounded-2xl p-6 max-w-xs w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">사진 업로드 QR</h2>
          <button onClick={onClose} className="p-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
            <IoCloseOutline size={22} />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <QRCodeSVG value={url} size={200} />
          {/* 다운로드용 hidden canvas */}
          <QRCodeCanvas id="qr-canvas" value={url} size={400} className="hidden" />
        </div>

        <p className="text-xs text-text-secondary text-center mb-4 break-all">{url}</p>

        <button
          onClick={handleDownload}
          className="qr-download-button w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer"
        >
          <IoDownloadOutline size={16} />
          QR 이미지 저장
        </button>
      </div>
    </div>
  );
};

const NOTICE_KEY = "upload_notice_dismissed";

export const UploadTab: FC<UploadTabProps> = ({ weddingId, setActiveTab }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showQr, setShowQr] = useState(false);
  const [showNotice, setShowNotice] = useState(
    () => localStorage.getItem(NOTICE_KEY) !== "true",
  );

  const dismissNotice = () => {
    localStorage.setItem(NOTICE_KEY, "true");
    setShowNotice(false);
  };

  const qrUrl = `${window.location.origin}/${weddingId}?tab=upload`;

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
        <button
          onClick={() => setShowQr(true)}
          className="qr-button p-2 hover:bg-bg-primary rounded-full transition-colors cursor-pointer"
          title="QR 코드 보기"
        >
          <IoQrCodeOutline className="text-xl text-text-primary" />
        </button>
      </div>

      {/* 공지 배너 */}
      {showNotice && (
        <div className="upload-notice flex items-start gap-3 px-4 py-3 mb-5 rounded-xl bg-primary/10 border border-primary/20">
          <IoNotificationsOutline size={18} className="text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-primary flex-1 leading-relaxed">
            결혼식 사진을 올려주세요.
          </p>
          <button
            onClick={dismissNotice}
            className="p-0.5 text-primary/60 hover:text-primary transition-colors cursor-pointer shrink-0"
            aria-label="공지 닫기"
          >
            <IoCloseOutline size={18} />
          </button>
        </div>
      )}

      {/* 업로드 폼 */}
      <UploadForm weddingId={weddingId} onUploadComplete={handleUploadComplete} />

      {/* 구분선 */}
      <hr className="my-6 border-border" />

      {/* 내 업로드 목록 */}
      <MyUploadList weddingId={weddingId} refreshKey={refreshKey} />

      {/* QR 모달 */}
      {showQr && <QrModal url={qrUrl} onClose={() => setShowQr(false)} />}
    </div>
  );
};
