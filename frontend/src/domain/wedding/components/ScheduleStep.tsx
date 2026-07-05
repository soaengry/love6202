import type { FC } from "react";
import { useFieldArray, type Control, type FieldErrors } from "react-hook-form";
import {
  IoAddCircleOutline,
  IoTrashOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
} from "react-icons/io5";
import type { WeddingFormData } from "../types.ts";

interface ScheduleStepProps {
  control: Control<WeddingFormData>;
  errors: FieldErrors<WeddingFormData>;
  register: ReturnType<
    typeof import("react-hook-form").useForm<WeddingFormData>
  >["register"];
}

export const ScheduleStep: FC<ScheduleStepProps> = ({
  control,
  errors,
  register,
}) => {
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: "schedules",
  });

  const handleAdd = () => {
    append({ title: "", description: "", orderIndex: fields.length });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">식순</h2>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors cursor-pointer"
        >
          <IoAddCircleOutline size={18} />
          추가
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-8">
          식순 항목을 추가해주세요. (선택)
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-bg-secondary rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">
                #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => swap(index, index - 1)}
                    className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <IoArrowUpOutline size={16} />
                  </button>
                )}
                {index < fields.length - 1 && (
                  <button
                    type="button"
                    onClick={() => swap(index, index + 1)}
                    className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <IoArrowDownOutline size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1.5 text-error hover:text-error-hover transition-colors cursor-pointer"
                >
                  <IoTrashOutline size={16} />
                </button>
              </div>
            </div>

            <input
              type="hidden"
              {...register(`schedules.${index}.orderIndex`)}
              value={index}
            />

            <div>
              <input
                {...register(`schedules.${index}.title`)}
                placeholder="식순 제목 (예: 신랑 입장)"
                className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
              {errors.schedules?.[index]?.title && (
                <p className="mt-1 text-sm text-error">
                  {errors.schedules[index].title?.message}
                </p>
              )}
            </div>

            <textarea
              {...register(`schedules.${index}.description`)}
              placeholder="설명 (선택)"
              rows={2}
              className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
