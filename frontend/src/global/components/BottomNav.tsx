import type { FC } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/domain/auth/store/useAuthStore.ts";
import {
  IoHeartCircleOutline,
  IoHeartCircle,
  IoTodayOutline,
  IoToday,
  IoFootstepsOutline,
  IoFootsteps,
  IoImagesOutline,
  IoImages,
  IoCloudUploadOutline,
  IoCloudUpload,
  IoPersonOutline,
  IoPerson,
} from "react-icons/io5";

export type TabId = "info" | "rsvp" | "guestbook" | "gallery" | "upload";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  {
    id: "info" as TabId,
    label: "정보",
    icon: IoHeartCircleOutline,
    activeIcon: IoHeartCircle,
  },
  {
    id: "rsvp" as TabId,
    label: "참석여부",
    icon: IoTodayOutline,
    activeIcon: IoToday,
  },
  {
    id: "guestbook" as TabId,
    label: "방명록",
    icon: IoFootstepsOutline,
    activeIcon: IoFootsteps,
  },
  {
    id: "gallery" as TabId,
    label: "갤러리",
    icon: IoImagesOutline,
    activeIcon: IoImages,
  },
  {
    id: "upload" as TabId,
    label: "업로드",
    icon: IoCloudUploadOutline,
    activeIcon: IoCloudUpload,
  },
] as const;

const myPageTab = {
  label: "마이페이지",
  icon: IoPersonOutline,
  activeIcon: IoPerson,
};

export const BottomNav: FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMyPage = location.pathname === "/me";
  const isWeddingPage =
    location.pathname === "/" || /^\/\d+$/.test(location.pathname);

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = !isMyPage && activeTab === tab.id;
          const Icon = isActive ? tab.activeIcon : tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isWeddingPage) {
                  navigate(location.pathname.match(/^\/(\d+)$/)?.[0] ?? "/");
                }
                onTabChange(tab.id);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full cursor-pointer transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="text-2xl" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
        {/* 마이페이지 — 로그인 유저만 */}
        {isAuthenticated && (
          <button
            onClick={() => navigate("/me")}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full cursor-pointer transition-colors ${
              isMyPage
                ? "text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {isMyPage ? (
              <myPageTab.activeIcon className="text-xl" />
            ) : (
              <myPageTab.icon className="text-xl" />
            )}
            <span className="text-[10px] font-medium">{myPageTab.label}</span>
          </button>
        )}
      </div>
    </nav>
  );
};
