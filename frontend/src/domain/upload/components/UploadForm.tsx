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
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (newFiles: File[]): File[] => {
    const valid: File[] = [];
    for (const file of newFiles) {
      if (!UPLOAD_VALIDATION.ACCEPTED_TYPES.includes(file.type as "image/jpeg" | "image/png")) {
        toast.error(`${file.name}: JPEG, PNG 형식만 가능합니다.`);
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
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      await uploadApi.upload(weddingId, formData);
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
        className="upload-dropzone border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <IoCloudUploadOutline className="text-4xl text-text-secondary mx-auto mb-3" />
        <p className="text-sm text-text-secondary">
          터치하여 사진을 선택하세요
        </p>
        <p className="text-xs text-text-tertiary mt-1">
          JPEG, PNG · 최대 {UPLOAD_VALIDATION.MAX_FILE_SIZE_MB}MB ·{" "}
          {UPLOAD_VALIDATION.MAX_UPLOAD_COUNT}장까지
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
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
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="remove-button absolute top-1 right-1 text-white bg-black/50 rounded-full cursor-pointer"
              >
                <IoCloseCircleOutline className="text-lg" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 업로드 버튼 */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="upload-button w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isUploading ? "업로드 중..." : `${files.length}장 업로드`}
        </button>
      )}
    </div>
  );
};
