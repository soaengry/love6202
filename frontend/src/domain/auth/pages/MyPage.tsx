import { useState, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IoArrowBackOutline, IoCreateOutline, IoLogOutOutline, IoTrashOutline, IoAddCircleOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore.ts";
import { authApi } from "../api/authApi.ts";
import { getDeviceId } from "../auth.utils.ts";
import { weddingApi } from "@/domain/wedding/api/weddingApi.ts";

export const MyPage: FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingWedding, setIsDeletingWedding] = useState(false);
  const [hasWedding, setHasWedding] = useState<boolean | null>(null);
  const [weddingId, setWeddingId] = useState<number | null>(null);

  useEffect(() => {
    weddingApi.getMyWedding()
      .then((res) => {
        setHasWedding(true);
        setWeddingId(res.data.wedding.id);
      })
      .catch(() => setHasWedding(false));
  }, []);

  const handleDeleteWedding = async () => {
    if (!weddingId) return;
    if (!window.confirm("정말 초대장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

    setIsDeletingWedding(true);
    try {
      await weddingApi.deleteWedding(weddingId);
      setHasWedding(false);
      setWeddingId(null);
      toast.success("초대장이 삭제되었습니다.");
    } catch {
      toast.error("초대장 삭제에 실패했습니다.");
    } finally {
      setIsDeletingWedding(false);
    }
  };

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
    <div className="my-page min-h-screen bg-bg-secondary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto p-6"
      >
        {/* 헤더 */}
        <div className="page-header flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="back-button p-2 hover:bg-bg-primary rounded-full transition-colors cursor-pointer"
          >
            <IoArrowBackOutline className="text-xl text-text-primary" />
          </button>
          <h1 className="page-title text-xl font-semibold text-text-primary">마이페이지</h1>
        </div>

        {/* 프로필 카드 */}
        <div className="profile-section bg-bg-primary rounded-2xl shadow-sm border border-border p-5 mb-4 relative">
          <button
            onClick={() => navigate("/me/edit")}
            className="profile-edit-button absolute top-4 right-4 p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <IoCreateOutline size={20} />
          </button>
          <div className="profile-info flex items-center gap-4">
            <img
              src={user.profileImageUrl}
              alt="프로필"
              className="profile-avatar w-16 h-16 rounded-full object-cover bg-bg-secondary border border-border"
            />
            <div className="profile-details">
              <h2 className="profile-nickname text-lg font-semibold text-text-primary">{user.nickname}</h2>
              <p className="profile-email text-sm text-text-secondary">{user.email}</p>
              <span className="profile-role mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* 메뉴 */}
        <div className="menu-section bg-bg-primary rounded-2xl shadow-sm border border-border divide-y divide-border">
          <button
            onClick={() => navigate("/me/edit")}
            className="menu-item menu-edit w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            <IoCreateOutline className="text-xl text-text-secondary" />
            <span className="text-text-primary">프로필 수정</span>
          </button>

          {hasWedding === null ? null : hasWedding ? (
            <>
              <button
                onClick={() => navigate("/edit")}
                className="menu-item menu-edit-wedding w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                <IoCreateOutline className="text-xl text-primary" />
                <span className="text-text-primary">청첩장 수정하기</span>
              </button>
              <button
                onClick={handleDeleteWedding}
                disabled={isDeletingWedding}
                className="menu-item menu-delete-wedding w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                <IoTrashOutline className="text-xl text-red-500" />
                <span className="text-red-500">{isDeletingWedding ? "삭제 중..." : "초대장 삭제"}</span>
              </button>
            </>
          ) : user.role === "ADMIN" && (
            <button
              onClick={() => navigate("/create")}
              className="menu-item menu-create-wedding w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              <IoAddCircleOutline className="text-xl text-primary" />
              <span className="text-text-primary">청첩장 만들기</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="menu-item menu-logout w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            <IoLogOutOutline className="text-xl text-text-secondary" />
            <span className="text-text-primary">로그아웃</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="menu-item menu-delete w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <IoTrashOutline className="text-xl text-red-500" />
            <span className="text-red-500">{isDeleting ? "처리 중..." : "회원 탈퇴"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
