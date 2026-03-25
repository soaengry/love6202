import type { FC } from "react";
import { IoImagesOutline } from "react-icons/io5";

export const GalleryTab: FC = () => {
  return (
    <div className="gallery-tab text-center py-16">
      <IoImagesOutline className="text-5xl text-text-secondary mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-text-primary mb-2">갤러리</h2>
      <p className="text-sm text-text-secondary">준비 중입니다.</p>
    </div>
  );
};
