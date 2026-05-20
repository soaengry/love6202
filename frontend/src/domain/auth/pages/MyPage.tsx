import { useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  IoArrowBackOutline,
  IoCreateOutline,
  IoLogOutOutline,
  IoTrashOutline,
  IoAddCircleOutline,
  IoShieldCheckmarkOutline,
  IoDocumentsOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore.ts";
import { authApi } from "../api/authApi.ts";
import { getDeviceId } from "../auth.utils.ts";
import { useMyWedding } from "../hooks/useMyWedding.ts";
import { useAdminWeddings } from "../hooks/useAdminWeddings.ts";
import { WeddingCard } from "@/domain/admin/components/WeddingCard.tsx";
import { UserPermissionManager } from "@/domain/admin/components/UserPermissionManager.tsx";

export const MyPage: FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const { myWedding, hasWedding } = useMyWedding();
  const { adminWeddings, updateWedding } = useAdminWeddings(user?.role === "ADMIN");

  const handleLogout = async () => {
    try {
      await authApi.logout(getDeviceId());
    } catch {
      // 서버 에러여도 로컬 로그아웃 진행
    }
    // navigate 먼저: ProtectedRoute가 /login으로 리다이렉트하기 전에 public 경로로 이동
    navigate("/", { replace: true });
    logout();
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "정말 탈퇴하시겠습니까? 30일 이내에 재로그인하면 복구됩니다.",
      )
    )
      return;

    setIsDeleting(true);
    try {
      await authApi.deleteAccount();
      logout();
      toast.success("회원 탈퇴가 완료되었습니다.");
      navigate("/", { replace: true });
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
          <h1 className="page-title text-xl font-semibold text-text-primary">
            마이페이지
          </h1>
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
              <h2 className="profile-nickname text-lg font-semibold text-text-primary">
                {user.nickname}
              </h2>
              <p className="profile-email text-sm text-text-secondary">
                {user.email}
              </p>
              <span className="profile-role mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Admin 섹션 */}
        {user.role === "ADMIN" && (
          <>
            <div className="admin-wedding-section mb-4">
              <h2 className="admin-section-title flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                <IoDocumentsOutline className="text-lg text-primary" />
                청첩장 관리
              </h2>
              {adminWeddings.length > 0 ? (
                <div className="admin-wedding-list grid gap-3">
                  {adminWeddings.map((w) => (
                    <WeddingCard key={w.id} wedding={w} onPinChange={updateWedding} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary text-center py-4">
                  등록된 청첩장이 없습니다.
                </p>
              )}
            </div>

            <div className="admin-permission-section bg-bg-primary rounded-2xl shadow-sm border border-border p-5 mb-4">
              <h2 className="admin-section-title flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                <IoShieldCheckmarkOutline className="text-lg text-primary" />
                권한 관리
              </h2>
              <UserPermissionManager />
            </div>
          </>
        )}

        {/* 내 청첩장 */}
        {hasWedding && myWedding && (
          <div className="my-wedding-section mb-4">
            <h2 className="section-title flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
              <IoDocumentsOutline className="text-lg text-primary" />
              내 청첩장
            </h2>
            <WeddingCard wedding={myWedding} />
          </div>
        )}

        {/* 메뉴 */}
        <div className="menu-section bg-bg-primary rounded-2xl shadow-sm border border-border divide-y divide-border">
          {user.role === "ADMIN" && !hasWedding && hasWedding !== null && (
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
            className="menu-item menu-delete w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-error-light transition-colors cursor-pointer disabled:opacity-50"
          >
            <IoTrashOutline className="text-xl text-error" />
            <span className="text-error">
              {isDeleting ? "처리 중..." : "회원 탈퇴"}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
