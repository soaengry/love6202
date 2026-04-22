import { useRef, useMemo, useEffect, type FC } from "react";
import { IoCloudUploadOutline, IoCloseCircleOutline } from "react-icons/io5";
import { toast } from "react-toastify";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

interface ImageUploaderProps {
  images: File[];
  onChange: (files: File[]) => void;
  maxCount?: number;
  label?: string;
  existingUrls?: string[];
  onRemoveExisting?: (index: number) => void;
}

export const ImageUploader: FC<ImageUploaderProps> = ({ images, onChange, maxCount = 4, label = "이미지 업로드", existingUrls = [], onRemoveExisting }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const totalCount = existingUrls.length + images.length;

  // 렌더링마다 새 URL이 생성되는 메모리 누수 방지: images 배열이 바뀔 때만 URL 재생성
  const previewUrls = useMemo(
    () => images.map((file) => URL.createObjectURL(file)),
    [images],
  );
  useEffect(() => () => previewUrls.forEach(URL.revokeObjectURL), [previewUrls]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const invalid = files.filter((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE);
    if (invalid.length > 0) toast.error("JPG, PNG만 허용되며 파일 크기는 2MB 이하여야 합니다.");
    const valid = files.filter((f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    const remaining = maxCount - totalCount;
    if (remaining > 0) {
      onChange([...images, ...valid.slice(0, remaining)]);
    } else {
      toast.error(`이미지는 최대 ${maxCount}장까지 추가할 수 있습니다.`);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>

      {/* 미리보기 */}
      {totalCount > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {existingUrls.map((url, i) => (
            <div key={`existing-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={url} alt={`기존 이미지 ${i + 1}`} className="w-full h-full object-cover" />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(i)}
                  className="absolute top-0.5 right-0.5 text-white bg-overlay rounded-full cursor-pointer"
                >
                  <IoCloseCircleOutline size={18} />
                </button>
              )}
            </div>
          ))}
          {images.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img
                src={previewUrls[i]}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-0.5 right-0.5 text-white bg-overlay rounded-full cursor-pointer"
              >
                <IoCloseCircleOutline size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 버튼 */}
      {totalCount < maxCount && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-xl text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          <IoCloudUploadOutline size={18} />
          {label} ({totalCount}/{maxCount})
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple={maxCount > 1}
        onChange={handleSelect}
        className="hidden"
      />
      <p className="mt-1 text-xs text-text-secondary">JPG, PNG / 최대 2MB</p>
    </div>
  );
}

// ─── Single Image Uploader (프로필용) ───────────────────

interface SingleImageUploaderProps {
  image: File | null;
  previewUrl?: string;
  onChange: (file: File | null) => void;
  label?: string;
}

export const SingleImageUploader: FC<SingleImageUploaderProps> = ({ image, previewUrl, onChange, label = "프로필 이미지" }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // image가 바뀔 때만 URL 재생성하여 메모리 누수 방지
  const displayUrl = useMemo(
    () => (image ? URL.createObjectURL(image) : previewUrl),
    [image, previewUrl],
  );
  useEffect(() => {
    return () => {
      if (displayUrl?.startsWith("blob:")) URL.revokeObjectURL(displayUrl);
    };
  }, [displayUrl]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
      toast.error("JPG, PNG만 허용되며 파일 크기는 2MB 이하여야 합니다.");
      return;
    }
    onChange(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <div
        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-bg-secondary cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <img src={displayUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            <IoCloudUploadOutline size={24} />
          </div>
        )}
      </div>
      {image && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-error hover:underline cursor-pointer"
        >
          삭제
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleSelect}
        className="hidden"
      />
    </div>
  );
}
