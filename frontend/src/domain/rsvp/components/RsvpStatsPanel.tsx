import type { FC } from "react";
import type { RsvpStatsResponse } from "../types";

interface RsvpStatsPanelProps {
  stats: RsvpStatsResponse;
}

interface StatTileProps {
  label: string;
  value: number;
  unit?: string;
}

const StatTile: FC<StatTileProps> = ({ label, value, unit = "명" }) => (
  <div className="stat-tile flex flex-col items-center justify-center bg-surface border border-border-light rounded-xl py-4 px-3">
    <p className="stat-value text-2xl font-bold text-primary">{value}</p>
    <p className="stat-unit text-xs text-text-tertiary mt-0.5">{unit}</p>
    <p className="stat-label text-[11px] text-text-secondary mt-1">{label}</p>
  </div>
);

export const RsvpStatsPanel: FC<RsvpStatsPanelProps> = ({ stats }) => {
  return (
    <div className="rsvp-stats-panel space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="총 응답" value={stats.totalRsvpCount} unit="건" />
        <StatTile label="참석 확정" value={stats.attendingCount} />
        <StatTile label="총 참석 인원" value={stats.totalAttendeeCount} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="식사 인원" value={stats.totalMealCount} />
        <StatTile label="셔틀 탑승" value={stats.totalShuttleCount} />
      </div>
    </div>
  );
};
