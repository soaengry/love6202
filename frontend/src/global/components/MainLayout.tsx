import { useState, type FC } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { BottomNav, type TabId } from "./BottomNav.tsx";

const TAB_IDS: TabId[] = ["info", "rsvp", "guestbook", "gallery", "upload"];

export const MainLayout: FC = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const initialTab: TabId = tabParam && TAB_IDS.includes(tabParam) ? tabParam : "info";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  return (
    <div className="min-h-screen bg-bg-secondary pb-24">
      <Outlet context={{ activeTab, setActiveTab }} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
