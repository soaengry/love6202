import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IoPersonCircleOutline, IoCreateOutline, IoLogOutOutline, IoTrashOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore.ts";
import { authApi } from "../api/authApi.ts";
import { getDeviceId } from "../auth.utils.ts";

export function MyPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout(getDeviceId());
    } catch {
      // 서버 에러여도 로컬 로그아웃 진행
    }
    logout();
    navigate("/login", { replace: true });
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까? 30일 이내에 재로그인하면 복구됩니다.")) return;

    setIsDeleting(true);
    try {
      await authApi.deleteAccount();
      logout();
      toast.success("회원 탈퇴가 완료되었습니다.");
      navigate("/login", { replace: true });
    } catch {
      toast.error("탈퇴 처리에 실패했습니다.");
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto p-6"
      >
        {/* 프로필 섹션 */}
        <div className="bg-bg-primary rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="프로필"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <IoPersonCircleOutline className="w-16 h-16 text-text-secondary" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{user.nickname}</h2>
              <p className="text-sm text-text-secondary">{user.email}</p>
              <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* 메뉴 */}
        <div className="bg-bg-primary rounded-2xl shadow-sm divide-y divide-border">
          <button
            onClick={() => navigate("/me/edit")}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            <IoCreateOutline className="text-xl text-text-secondary" />
            <span className="text-text-primary">프로필 수정</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            <IoLogOutOutline className="text-xl text-text-secondary" />
            <span className="text-text-primary">로그아웃</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <IoTrashOutline className="text-xl text-red-500" />
            <span className="text-red-500">{isDeleting ? "처리 중..." : "회원 탈퇴"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
