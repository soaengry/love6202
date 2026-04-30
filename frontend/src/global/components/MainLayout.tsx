import { useState, type FC } from "react";
import { Outlet, useSearchParams, Link } from "react-router-dom";
import { BottomNav, type TabId } from "./BottomNav.tsx";

const TAB_IDS: TabId[] = ["info", "rsvp", "guestbook", "gallery", "upload"];

const AppFooter: FC = () => (
  <footer className="app-footer text-center py-6 px-4 border-t border-border">
    <p className="text-xs font-semibold text-text-secondary tracking-widest mb-1">LOVE6202</p>
    <p className="text-xs text-text-secondary mb-3">디지털 웨딩 초대장 서비스</p>
    <div className="flex justify-center gap-4 text-xs text-text-secondary">
      <Link to="/privacy" className="underline hover:text-text-primary transition-colors">개인정보처리방침</Link>
      <Link to="/terms" className="underline hover:text-text-primary transition-colors">이용약관</Link>
    </div>
  </footer>
);

export const MainLayout: FC = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const initialTab: TabId = tabParam && TAB_IDS.includes(tabParam) ? tabParam : "info";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  return (
    <div className="min-h-screen bg-bg-secondary pb-16">
      <Outlet context={{ activeTab, setActiveTab }} />
      <AppFooter />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
