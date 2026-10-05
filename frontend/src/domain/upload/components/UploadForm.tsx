import { useState, useRef, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloudUploadOutline, IoCloseCircleOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { uploadApi } from "../api/uploadApi";
import { UPLOAD_VALIDATION } from "../upload.constants";

interface UploadFormProps {
  weddingId: number;
  onUploadComplete: () => void;
}

export const UploadForm: FC<UploadFormProps> = ({
  weddingId,
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (newFiles: File[]): File[] => {
    const valid: File[] = [];
    for (const file of newFiles) {
      if (!UPLOAD_VALIDATION.ACCEPTED_TYPES.includes(file.type as "image/jpeg" | "image/png" | "image/webp")) {
        toast.error(`${file.name}: JPEG, PNG, WebP 형식만 가능합니다.`);
        continue;
      }
      if (file.size > UPLOAD_VALIDATION.MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: ${UPLOAD_VALIDATION.MAX_FILE_SIZE_MB}MB 이하만 가능합니다.`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const totalCount = files.length + selected.length;
    if (totalCount > UPLOAD_VALIDATION.MAX_UPLOAD_COUNT) {
      toast.error(`최대 ${UPLOAD_VALIDATION.MAX_UPLOAD_COUNT}장까지 선택 가능합니다.`);
      return;
    }

    const valid = validateFiles(selected);
    if (!valid.length) return;

    const newPreviews = valid.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...newPreviews]);

    e.target.value = "";
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!files.length || isUploading) return;

    setIsUploading(true);
    setProgress(0);
    try {
      // 1) S3 직접 업로드용 URL 발급
      const { data: presigned } = await uploadApi.presign(
        weddingId,
        files.map((file) => ({ contentType: file.type, size: file.size })),
      );

      // 2) PUT_CONCURRENCY개씩 S3에 직접 전송, 파일별 전송량을 합산해 전체 진행률 표시
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
      const loadedBytes = files.map(() => 0);
      const updateProgress = (index: number, loaded: number) => {
        loadedBytes[index] = loaded;
        const loadedSum = loadedBytes.reduce((sum, bytes) => sum + bytes, 0);
        setProgress(Math.min(100, Math.round((loadedSum / totalBytes) * 100)));
      };

      let nextIndex = 0;
      const putWorker = async () => {
        while (nextIndex < files.length) {
          const index = nextIndex++;
          await uploadApi.putToS3(presigned[index], files[index], (loaded) => updateProgress(index, loaded));
          updateProgress(index, files[index].size);
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(UPLOAD_VALIDATION.PUT_CONCURRENCY, files.length) }, putWorker),
      );

      // 3) 업로드 완료 등록 (썸네일은 서버에서 비동기 생성)
      await uploadApi.complete(weddingId, presigned.map(({ key }) => key));
      toast.success(`${files.length}장 업로드 완료`);

      previews.forEach(URL.revokeObjectURL);
      setFiles([]);
      setPreviews([]);
      onUploadComplete();
    } catch {
      toast.error("업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-form space-y-4">
      {/* 드래그 앤 드롭 영역 */}
      <div
        className={`upload-dropzone border-2 border-dashed border-border rounded-2xl p-8 text-center transition-colors ${
          isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-primary/50"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <IoCloudUploadOutline className="text-4xl text-text-secondary mx-auto mb-3" />
        <p className="text-sm text-text-secondary">
          터치하여 사진을 선택하세요
        </p>
        <p className="text-xs text-text-tertiary mt-1">
          JPEG, PNG, WebP · 최대 {UPLOAD_VALIDATION.MAX_FILE_SIZE_MB}MB ·{" "}
          {UPLOAD_VALIDATION.MAX_UPLOAD_COUNT}장까지
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* 선택된 파일 수 */}
      {files.length > 0 && (
        <p className="file-count text-sm text-text-secondary text-center">
          {files.length}장 선택됨
        </p>
      )}

      {/* 미리보기 그리드 */}
      <div className="preview-grid grid grid-cols-4 gap-2">
        <AnimatePresence>
          {previews.map((src, i) => (
            <motion.div
              key={src}
              className="preview-item relative aspect-square rounded-lg overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              {isUploading ? (
                <div className="uploading-overlay absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="remove-button absolute top-1 right-1 text-white bg-black/50 rounded-full cursor-pointer"
                >
                  <IoCloseCircleOutline className="text-lg" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 업로드 버튼 */}
      {files.length > 0 && (
        <div className="upload-action space-y-2">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="upload-button w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isUploading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {isUploading
              ? progress < 100
                ? `업로드 중... ${progress}%`
                : "등록 중..."
              : `${files.length}장 업로드`}
          </button>
          {isUploading && (
            <div className="upload-progress-track h-1.5 w-full bg-bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="upload-progress-bar h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
