import type { FC } from "react";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";

export const GuestbookTab: FC = () => {
  return (
    <div className="guestbook-tab text-center py-16">
      <IoChatbubbleEllipsesOutline className="text-5xl text-text-secondary mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-text-primary mb-2">방명록</h2>
      <p className="text-sm text-text-secondary">준비 중입니다.</p>
    </div>
  );
};
