import type { FC } from "react";
import { IoCloudUploadOutline } from "react-icons/io5";

export const UploadTab: FC = () => {
  return (
    <div className="upload-tab text-center py-16">
      <IoCloudUploadOutline className="text-5xl text-text-secondary mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-text-primary mb-2">업로드</h2>
      <p className="text-sm text-text-secondary">준비 중입니다.</p>
    </div>
  );
};
