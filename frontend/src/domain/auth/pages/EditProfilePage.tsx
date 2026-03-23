import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IoArrowBackOutline, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore.ts";
import { authApi } from "../api/authApi.ts";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export function EditProfilePage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [previewUrl, setPreviewUrl] = useState<string>(user?.profileImageUrl ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // blob URL cleanup
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const checkNickname = async (value: string) => {
    if (!value || value === user?.nickname) {
      setNicknameStatus("idle");
      return;
    }
    if (value.length < 2) return;

    setNicknameStatus("checking");
    try {
      const { data } = await authApi.checkNickname(value);
      setNicknameStatus(data.available ? "available" : "taken");
    } catch {
      setNicknameStatus("idle");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError("JPG, PNG 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError("파일 크기는 2MB 이하여야 합니다.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setImageRemoved(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    // default.png URL로 즉시 전환
    setPreviewUrl(user?.profileImageUrl?.includes("profiles/default.png")
      ? user.profileImageUrl
      : user?.profileImageUrl?.replace(/profiles\/[^/]+$/, "profiles/default.png") ?? "");
    setSelectedFile(null);
    setImageRemoved(true);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isDefaultImage = previewUrl.includes("profiles/default.png");
  const isNicknameEmpty = nickname.trim().length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nicknameStatus === "taken" || isNicknameEmpty) return;

    // 변경사항 없으면 바로 돌아감
    const nicknameChanged = nickname.trim() !== user?.nickname;
    if (!nicknameChanged && !selectedFile && !imageRemoved) {
      navigate("/me");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nickname", nickname.trim());

      if (selectedFile) {
        formData.append("profileImage", selectedFile);
      } else if (imageRemoved) {
        formData.append("removeProfileImage", "true");
      }

      const { data: updatedUser } = await authApi.updateProfile(formData);
      setUser(updatedUser);
      toast.success("프로필이 수정되었습니다.");
      navigate("/me");
    } catch {
      toast.error("프로필 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-profile-page min-h-screen bg-bg-secondary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto p-6"
      >
        {/* 헤더 */}
        <div className="page-header flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/me")}
            className="back-button p-2 hover:bg-bg-primary rounded-full transition-colors cursor-pointer"
          >
            <IoArrowBackOutline className="text-xl text-text-primary" />
          </button>
          <h1 className="page-title text-xl font-semibold text-text-primary">프로필 수정</h1>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="profile-form bg-bg-primary rounded-2xl shadow-sm border border-border p-6">
          {/* 프로필 이미지 */}
          <div className="profile-image-section flex flex-col items-center gap-2 mb-6">
            <div className="profile-image-wrapper relative w-28 h-28">
              <img
                src={previewUrl}
                alt="프로필"
                className="profile-image w-28 h-28 rounded-full object-cover bg-bg-secondary border-2 border-border"
              />

              {isSubmitting && (
                <div className="profile-image-loading absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!isSubmitting && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="profile-image-change absolute bottom-0 left-0 right-0 h-[20%] flex items-center justify-center rounded-b-full bg-black/50 text-white text-xs font-medium cursor-pointer"
                >
                  변경
                </button>
              )}

              {!isSubmitting && !isDefaultImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="profile-image-remove absolute -top-1 -right-1 w-6 h-6 rounded-full bg-text-secondary text-white flex items-center justify-center hover:bg-text-primary transition-colors shadow cursor-pointer"
                >
                  <IoCloseOutline size={16} />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageSelect}
              className="hidden"
            />

            <p className="profile-image-hint text-xs text-text-secondary">JPG, PNG / 최대 2MB</p>
            {imageError && <p className="profile-image-error text-xs text-red-500">{imageError}</p>}
          </div>

          {/* 닉네임 */}
          <div className="nickname-section mb-6">
            <label htmlFor="nickname" className="nickname-label block text-sm font-medium text-text-primary mb-2">
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onBlur={(e) => checkNickname(e.target.value)}
              className="nickname-input w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="닉네임을 입력하세요 (2~50자)"
            />
            {isNicknameEmpty && (
              <p className="nickname-error mt-1 text-sm text-red-500">닉네임을 입력해주세요.</p>
            )}
            {nicknameStatus === "checking" && (
              <p className="nickname-status mt-1 text-sm text-text-secondary">확인 중...</p>
            )}
            {nicknameStatus === "available" && (
              <p className="nickname-status mt-1 text-sm text-primary">사용 가능한 닉네임입니다.</p>
            )}
            {nicknameStatus === "taken" && (
              <p className="nickname-status mt-1 text-sm text-red-500">이미 사용 중인 닉네임입니다.</p>
            )}
          </div>

          {/* 버튼 */}
          <div className="button-group flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting || nicknameStatus === "taken" || isNicknameEmpty}
              className="submit-button flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "수정 중..." : "수정 완료"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/me")}
              className="cancel-button flex-1 py-3 border border-border text-text-secondary font-medium rounded-xl hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              취소
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
