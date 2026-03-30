import type { FC } from "react";
import type { RsvpResponse, RsvpAttendance, RsvpSide } from "../types";

interface RsvpCardProps {
  rsvp: RsvpResponse;
}

const attendanceLabel: Record<RsvpAttendance, { label: string; className: string }> = {
  YES: { label: "참석", className: "bg-primary/10 text-primary" },
  NO: { label: "불참", className: "bg-bg-tertiary text-text-tertiary" },
};

const sideLabel: Record<RsvpSide, string> = {
  BRIDE: "신부측",
  GROOM: "신랑측",
};

export const RsvpCard: FC<RsvpCardProps> = ({ rsvp }) => {
  const attendance = attendanceLabel[rsvp.attendance];
  const formattedDate = new Date(rsvp.createdAt).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rsvp-card p-4 rounded-xl bg-surface border border-border-light space-y-3">
      {/* 헤더: 이름 + 참석 여부 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rsvp-name text-sm font-semibold text-text-primary">{rsvp.name}</span>
          <span className="rsvp-side text-xs text-text-tertiary">{sideLabel[rsvp.side]}</span>
        </div>
        <span className={`rsvp-attendance text-xs font-medium px-2.5 py-1 rounded-full ${attendance.className}`}>
          {attendance.label}
        </span>
      </div>

      {/* 연락처 */}
      <p className="rsvp-phone text-xs text-text-secondary">{rsvp.phone}</p>

      {/* 인원 정보 */}
      {rsvp.attendance === "YES" && (
        <div className="flex flex-wrap gap-2">
          <span className="rsvp-chip text-[11px] bg-bg-secondary text-text-secondary px-2.5 py-1 rounded-full">
            참석 {rsvp.attendeeCount}명
          </span>
          {rsvp.meal.willEat && (
            <span className="rsvp-chip text-[11px] bg-bg-secondary text-text-secondary px-2.5 py-1 rounded-full">
              식사 {rsvp.meal.mealCount}명
            </span>
          )}
          {rsvp.shuttle.willRide && (
            <span className="rsvp-chip text-[11px] bg-bg-secondary text-text-secondary px-2.5 py-1 rounded-full">
              셔틀 {rsvp.shuttle.rideCount}명
            </span>
          )}
        </div>
      )}

      {/* 전달사항 */}
      {rsvp.note && (
        <p className="rsvp-note text-xs text-text-secondary bg-bg-secondary rounded-lg px-3 py-2 leading-relaxed">
          {rsvp.note}
        </p>
      )}

      {/* 작성일 */}
      <p className="rsvp-date text-[10px] text-text-muted text-right">{formattedDate}</p>
    </div>
  );
};
