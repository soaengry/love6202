import { type FC } from "react";
import { motion } from "framer-motion";
import type { GalleryImage } from "../types";

interface MasonryGridProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
}

export const MasonryGrid: FC<MasonryGridProps> = ({ images, onImageClick }) => {
  // 3열 분배: 순서대로 교대 배치
  const columns: { image: GalleryImage; globalIndex: number }[][] = [[], [], []];

  images.forEach((image, i) => {
    columns[i % 3].push({ image, globalIndex: i });
  });

  const renderItem = (
    { image, globalIndex }: { image: GalleryImage; globalIndex: number },
    columnIndex: number,
  ) => (
    <motion.div
      key={image.id}
      className="masonry-item relative mb-1.5 rounded-md overflow-hidden cursor-pointer"
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
    <div className="masonry-grid flex gap-1.5">
      {columns.map((col, ci) => (
        <div key={ci} className="masonry-column flex-1 flex flex-col">
          {col.map((item, i) => renderItem(item, i))}
        </div>
      ))}
    </div>
  );
};
