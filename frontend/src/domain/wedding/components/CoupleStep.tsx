import type { FC } from "react";
import { Controller } from "react-hook-form";
import type { UseFormRegister, FieldErrors, Control } from "react-hook-form";
import type { WeddingFormData } from "../types.ts";
import { COUPLE_SECTIONS } from "../wedding.constants.ts";
import { SingleImageUploader } from "./ImageUploader.tsx";
import { formatPhoneDisplay } from "../wedding.utils.ts";

interface CoupleStepProps {
  register: UseFormRegister<WeddingFormData>;
  control: Control<WeddingFormData>;
  errors: FieldErrors<WeddingFormData>;
  groomProfileImage: File | null;
  brideProfileImage: File | null;
  onGroomImageChange: (file: File | null) => void;
  onBrideImageChange: (file: File | null) => void;
  groomPreviewUrl?: string;
  bridePreviewUrl?: string;
}


export const CoupleStep: FC<CoupleStepProps> = ({
  register,
  control,
  errors,
  groomProfileImage,
  brideProfileImage,
  onGroomImageChange,
  onBrideImageChange,
  groomPreviewUrl,
  bridePreviewUrl,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-text-primary">신랑 · 신부 정보</h2>

      {COUPLE_SECTIONS.map(({ index, label, imageLabel }) => {
        const coupleErrors = errors.couples?.[index];
        const imageFile = index === 0 ? groomProfileImage : brideProfileImage;
        const onImageChange = index === 0 ? onGroomImageChange : onBrideImageChange;
        const previewUrl = index === 0 ? groomPreviewUrl : bridePreviewUrl;

        return (
          <div key={label} className="bg-bg-secondary rounded-xl p-4 space-y-4">
            <div className="flex flex-col gap-3">
              <h3 className="font-medium text-text-primary">{label} 정보</h3>
              <SingleImageUploader
                image={imageFile}
                previewUrl={previewUrl}
                onChange={onImageChange}
                label={imageLabel}
              />
            </div>

            {/* hidden role field */}
            <input type="hidden" {...register(`couples.${index}.role`)} />

            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                이름 <span className="text-error">*</span>
              </label>
              <input
                {...register(`couples.${index}.name`)}
                placeholder={`${label} 이름`}
                className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
              {coupleErrors?.name && (
                <p className="mt-1 text-sm text-error">{coupleErrors.name.message}</p>
              )}
            </div>

            {/* 연락처 / 이메일 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">연락처</label>
                <Controller
                  name={`couples.${index}.contact`}
                  control={control}
                  render={({ field }) => (
                    <input
                      value={formatPhoneDisplay(field.value ?? "")}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                        field.onChange(digits);
                      }}
                      inputMode="numeric"
                      placeholder="010-0000-0000"
                      className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">이메일</label>
                <input
                  {...register(`couples.${index}.email`)}
                  type="email"
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* 부모님 정보 */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-text-secondary">부모님 정보</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-text-primary mb-1">아버지 성함</label>
                  <input
                    {...register(`couples.${index}.fatherName`)}
                    placeholder="성함"
                    className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`couples.${index}.isFatherAlive`)}
                      className="rounded accent-primary"
                      defaultChecked
                    />
                    생존
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-text-primary mb-1">어머니 성함</label>
                  <input
                    {...register(`couples.${index}.motherName`)}
                    placeholder="성함"
                    className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`couples.${index}.isMotherAlive`)}
                      className="rounded accent-primary"
                      defaultChecked
                    />
                    생존
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
