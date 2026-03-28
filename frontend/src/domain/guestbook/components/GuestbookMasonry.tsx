import { type FC } from "react";
import { GuestbookCard } from "./GuestbookCard";
import type { GuestbookEntry } from "../types";

interface GuestbookMasonryProps {
  entries: GuestbookEntry[];
  canDelete: boolean;
  onDelete: (id: number) => void;
}

export const GuestbookMasonry: FC<GuestbookMasonryProps> = ({ entries, canDelete, onDelete }) => {
  // 2열 분배: 좌-우 교대로 배치
  const leftColumn: { entry: GuestbookEntry; globalIndex: number }[] = [];
  const rightColumn: { entry: GuestbookEntry; globalIndex: number }[] = [];

  entries.forEach((entry, i) => {
    if (i % 2 === 0) {
      leftColumn.push({ entry, globalIndex: i });
    } else {
      rightColumn.push({ entry, globalIndex: i });
    }
  });

  return (
    <div className="guestbook-masonry flex gap-3 px-1">
      <div className="masonry-column flex-1 flex flex-col">
        {leftColumn.map(({ entry, globalIndex }) => (
          <GuestbookCard
            key={entry.id}
            entry={entry}
            index={globalIndex}
            canDelete={canDelete}
            onDelete={onDelete}
          />
        ))}
      </div>
      <div className="masonry-column flex-1 flex flex-col">
        {rightColumn.map(({ entry, globalIndex }) => (
          <GuestbookCard
            key={entry.id}
            entry={entry}
            index={globalIndex}
            canDelete={canDelete}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
