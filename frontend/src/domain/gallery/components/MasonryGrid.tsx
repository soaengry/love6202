import { type FC } from "react";
import { motion } from "framer-motion";
import type { GalleryImage } from "../types";

interface MasonryGridProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
}

export const MasonryGrid: FC<MasonryGridProps> = ({ images, onImageClick }) => {
  // 2열 분배: 좌-우 교대로 배치
  const leftColumn: { image: GalleryImage; globalIndex: number }[] = [];
  const rightColumn: { image: GalleryImage; globalIndex: number }[] = [];

  images.forEach((image, i) => {
    if (i % 2 === 0) {
      leftColumn.push({ image, globalIndex: i });
    } else {
      rightColumn.push({ image, globalIndex: i });
    }
  });

  const renderItem = (
    { image, globalIndex }: { image: GalleryImage; globalIndex: number },
    columnIndex: number,
  ) => (
    <motion.div
      key={image.id}
      className="masonry-item relative mb-2 rounded-lg overflow-hidden cursor-pointer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: columnIndex * 0.05, duration: 0.3 }}
      onClick={() => onImageClick(globalIndex)}
    >
      {/* 이미지 보호 오버레이 */}
      <div className="image-protect absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
      <img
        src={image.thumbnailUrl ?? image.imageUrl}
        alt={image.caption ?? "갤러리 이미지"}
        className="gallery-image w-full h-auto block"
        loading="lazy"
        draggable={false}
      />
    </motion.div>
  );

  return (
    <div className="masonry-grid flex gap-2">
      <div className="masonry-column flex-1 flex flex-col">
        {leftColumn.map((item, i) => renderItem(item, i))}
      </div>
      <div className="masonry-column flex-1 flex flex-col">
        {rightColumn.map((item, i) => renderItem(item, i))}
      </div>
    </div>
  );
};
