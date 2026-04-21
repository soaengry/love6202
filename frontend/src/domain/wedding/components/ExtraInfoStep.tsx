import type { FC } from "react";
import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { IoAddCircleOutline, IoTrashOutline } from "react-icons/io5";
import type { WeddingFormData } from "../types.ts";
import { TRANSPORT_OPTIONS } from "../wedding.constants.ts";

interface ExtraInfoStepProps {
  control: Control<WeddingFormData>;
  errors: FieldErrors<WeddingFormData>;
  register: UseFormRegister<WeddingFormData>;
}

export const ExtraInfoStep: FC<ExtraInfoStepProps> = ({
  control,
  errors,
  register,
}) => {
  const transFields = useFieldArray({ control, name: "transportations" });
  const announceFields = useFieldArray({ control, name: "announcements" });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-text-primary">추가 정보</h2>

      {/* 드레스코드 */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          드레스코드
        </label>
        <input
          {...register("wedding.dressCode")}
          placeholder="예: 화이트 & 블랙"
          className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
      </div>

      {/* 주차 안내 */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          주차 안내
        </label>
        <textarea
          {...register("wedding.parkingInfo")}
          placeholder="주차 관련 안내사항"
          rows={2}
          className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* 식사 안내 */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          식사 안내
        </label>
        <textarea
          {...register("wedding.mealInfo")}
          placeholder="식사 관련 안내사항"
          rows={2}
          className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* 안내 / 공지사항 */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          안내 문구
        </label>
        <textarea
          {...register("wedding.notice")}
          placeholder="유의사항"
          rows={3}
          className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* ── 교통편 ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-text-primary">교통편</h3>
          <button
            type="button"
            onClick={() =>
              transFields.append({
                type: "SUBWAY",
                title: "",
                description: "",
                orderIndex: transFields.fields.length,
              })
            }
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors cursor-pointer"
          >
            <IoAddCircleOutline size={18} />
            추가
          </button>
        </div>

        {transFields.fields.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-4">
            교통편을 추가해주세요. (선택)
          </p>
        )}

        {transFields.fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-bg-secondary rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <input
                type="hidden"
                {...register(`transportations.${index}.orderIndex`)}
                value={index}
              />
              <select
                {...register(`transportations.${index}.type`)}
                className="px-3 py-2 border border-border rounded-lg bg-bg-primary text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {TRANSPORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => transFields.remove(index)}
                className="p-1.5 text-error hover:text-error-hover transition-colors cursor-pointer"
              >
                <IoTrashOutline size={16} />
              </button>
            </div>

            <input
              {...register(`transportations.${index}.title`)}
              placeholder="노선 또는 경로 (예: 2호선 강남역 5번 출구)"
              className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
            {errors.transportations?.[index]?.title && (
              <p className="mt-1 text-sm text-error">
                {errors.transportations[index].title?.message}
              </p>
            )}

            <textarea
              {...register(`transportations.${index}.description`)}
              placeholder="상세 설명 (선택)"
              rows={2}
              className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
            />
          </div>
        ))}
      </div>

      {/* ── 공지사항 ───────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-text-primary">공지사항</h3>
          <button
            type="button"
            onClick={() =>
              announceFields.append({ title: "", content: "", isPinned: false })
            }
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors cursor-pointer"
          >
            <IoAddCircleOutline size={18} />
            추가
          </button>
        </div>

        {announceFields.fields.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-4">
            공지사항을 추가해주세요. (선택)
          </p>
        )}

        {announceFields.fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-bg-secondary rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  {...register(`announcements.${index}.isPinned`)}
                  className="rounded accent-primary"
                />
                고정
              </label>
              <button
                type="button"
                onClick={() => announceFields.remove(index)}
                className="p-1.5 text-error hover:text-error-hover transition-colors cursor-pointer"
              >
                <IoTrashOutline size={16} />
              </button>
            </div>

            <input
              {...register(`announcements.${index}.title`)}
              placeholder="공지 제목"
              className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
            {errors.announcements?.[index]?.title && (
              <p className="mt-1 text-sm text-error">
                {errors.announcements[index].title?.message}
              </p>
            )}

            <textarea
              {...register(`announcements.${index}.content`)}
              placeholder="공지 내용"
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
            />
            {errors.announcements?.[index]?.content && (
              <p className="mt-1 text-sm text-error">
                {errors.announcements[index].content?.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
