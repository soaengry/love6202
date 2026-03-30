import { type FC } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { IoAddOutline, IoRemoveOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { isAxiosError } from "axios";
import { rsvpFormSchema, type RsvpFormSchema } from "../rsvp.schemas";
import { rsvpApi } from "../api/rsvpApi";
import { RSVP_VALIDATION } from "../rsvp.constants";
import type { RsvpResponse } from "../types";

interface RsvpFormProps {
  weddingId: number;
  existingRsvp?: RsvpResponse;
  onSuccess: (rsvp: RsvpResponse) => void;
  onCancel?: () => void;
}

const slideDown = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1, transition: { duration: 0.2 } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2 } },
};

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

const Stepper: FC<StepperProps> = ({ value, onChange, min = 0, max = 99 }) => (
  <div className="stepper flex items-center gap-3">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="stepper-btn w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-secondary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
    >
      <IoRemoveOutline size={16} />
    </button>
    <span className="stepper-value w-8 text-center text-base font-semibold text-text-primary select-none">
      {value}
    </span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="stepper-btn w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-secondary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
    >
      <IoAddOutline size={16} />
    </button>
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

const Toggle: FC<ToggleProps> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="toggle-row flex items-center justify-between w-full cursor-pointer"
  >
    <span className="toggle-label text-sm text-text-primary">{label}</span>
    <div
      className={`toggle-track w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <div
        className={`toggle-thumb absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </div>
  </button>
);

export const RsvpForm: FC<RsvpFormProps> = ({
  weddingId,
  existingRsvp,
  onSuccess,
  onCancel,
}) => {
  const isEdit = !!existingRsvp;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RsvpFormSchema>({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: existingRsvp
      ? {
          attendance: existingRsvp.attendance,
          name: existingRsvp.name,
          side: existingRsvp.side,
          phone: existingRsvp.phone,
          attendeeCount: existingRsvp.attendeeCount,
          meal: existingRsvp.meal,
          shuttle: existingRsvp.shuttle,
          note: existingRsvp.note ?? "",
          consent: true,
        }
      : {
          attendance: undefined as unknown as "YES" | "NO",
          name: "",
          side: undefined as unknown as "BRIDE" | "GROOM",
          phone: "",
          attendeeCount: 1,
          meal: { willEat: false, mealCount: 0 },
          shuttle: { willRide: false, rideCount: 0 },
          note: "",
          consent: false as unknown as true,
        },
  });

  const attendance = watch("attendance");
  const willEat = watch("meal.willEat");
  const willRide = watch("shuttle.willRide");
  const noteValue = watch("note");
  const consent = watch("consent");

  const onSubmit = async (values: RsvpFormSchema) => {
    try {
      let data: RsvpResponse;
      if (isEdit) {
        const res = await rsvpApi.update(existingRsvp.id, {
          attendance: values.attendance,
          name: values.name,
          side: values.side,
          phone: values.phone,
          attendeeCount: values.attendeeCount,
          meal: values.meal,
          shuttle: values.shuttle,
          note: values.note,
        });
        data = res.data!;
      } else {
        const res = await rsvpApi.create({
          weddingId,
          attendance: values.attendance,
          name: values.name,
          side: values.side,
          phone: values.phone,
          attendeeCount: values.attendeeCount,
          meal: values.meal,
          shuttle: values.shuttle,
          note: values.note,
          consent: values.consent,
        });
        data = res.data!;
      }
      toast.success(isEdit ? "수정되었습니다" : "참석 의사가 전달되었습니다");
      onSuccess(data);
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = err.response?.data?.status?.message;
        toast.error(msg ?? "저장에 실패했습니다");
      } else {
        toast.error("저장에 실패했습니다");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rsvp-form space-y-6">
      {/* 참석 여부 */}
      <div className="form-section space-y-2">
        <p className="form-label text-sm font-semibold text-text-primary">참석 여부 *</p>
        <div className="grid grid-cols-2 gap-3">
          {(["YES", "NO"] as const).map((val) => (
            <label
              key={val}
              className={`attendance-option flex items-center justify-center py-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                attendance === val
                  ? "border-primary bg-primary/5 text-primary font-semibold"
                  : "border-border text-text-secondary hover:border-border-dark"
              }`}
            >
              <input
                type="radio"
                value={val}
                {...register("attendance")}
                className="sr-only"
              />
              {val === "YES" ? "참석합니다" : "불참합니다"}
            </label>
          ))}
        </div>
        {errors.attendance && (
          <p className="error-msg text-xs text-red-500">{errors.attendance.message}</p>
        )}
      </div>

      {/* 참석 시에만 표시되는 항목들 */}
      <AnimatePresence>
        {attendance && (
          <motion.div
            variants={slideDown}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden space-y-6"
          >
            {/* 성함 + 측 선택 */}
            <div className="form-section space-y-4">
              <div className="space-y-2">
                <label className="form-label text-sm font-semibold text-text-primary">
                  성함 *
                </label>
                <input
                  {...register("name")}
                  placeholder="이름을 입력해주세요"
                  className="form-input w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                {errors.name && (
                  <p className="error-msg text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="form-label text-sm font-semibold text-text-primary">측 선택 *</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["GROOM", "BRIDE"] as const).map((val) => {
                    const sideVal = watch("side");
                    return (
                      <label
                        key={val}
                        className={`side-option flex items-center justify-center py-3 rounded-xl border-2 cursor-pointer transition-all ${
                          sideVal === val
                            ? "border-primary bg-primary/5 text-primary font-semibold"
                            : "border-border text-text-secondary hover:border-border-dark"
                        }`}
                      >
                        <input
                          type="radio"
                          value={val}
                          {...register("side")}
                          className="sr-only"
                        />
                        {val === "GROOM" ? "신랑측" : "신부측"}
                      </label>
                    );
                  })}
                </div>
                {errors.side && (
                  <p className="error-msg text-xs text-red-500">{errors.side.message}</p>
                )}
              </div>
            </div>

            {/* 연락처 */}
            <div className="form-section space-y-2">
              <label className="form-label text-sm font-semibold text-text-primary">연락처 *</label>
              <input
                {...register("phone")}
                placeholder="참석자 대표 연락처 (예: 010-0000-0000)"
                className="form-input w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
              {errors.phone && (
                <p className="error-msg text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* 참석 인원 - 불참일 때는 숨김 */}
            {attendance === "YES" && (
              <>
                {/* 참석 인원 */}
                <div className="form-section space-y-2">
                  <p className="form-label text-sm font-semibold text-text-primary">참석 인원 *</p>
                  <div className="flex items-center justify-between bg-surface border border-border-light rounded-xl px-4 py-3">
                    <Controller
                      name="attendeeCount"
                      control={control}
                      render={({ field }) => (
                        <Stepper
                          value={field.value}
                          onChange={field.onChange}
                          min={1}
                          max={RSVP_VALIDATION.MAX_ATTENDEE_COUNT}
                        />
                      )}
                    />
                    <p className="text-xs text-text-tertiary">본인 포함 인원을 입력해주세요.</p>
                  </div>
                  {errors.attendeeCount && (
                    <p className="error-msg text-xs text-red-500">{errors.attendeeCount.message}</p>
                  )}
                </div>

                {/* 식사 여부 */}
                <div className="form-section space-y-3">
                  <div className="bg-surface border border-border-light rounded-xl px-4 py-3.5">
                    <Controller
                      name="meal.willEat"
                      control={control}
                      render={({ field }) => (
                        <Toggle
                          checked={field.value}
                          onChange={field.onChange}
                          label="식사 여부"
                        />
                      )}
                    />
                    <AnimatePresence>
                      {willEat && (
                        <motion.div
                          variants={slideDown}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="overflow-hidden"
                        >
                          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-light">
                            <p className="text-sm text-text-secondary">식사 인원</p>
                            <Controller
                              name="meal.mealCount"
                              control={control}
                              render={({ field }) => (
                                <Stepper
                                  value={field.value}
                                  onChange={field.onChange}
                                  min={1}
                                  max={RSVP_VALIDATION.MAX_MEAL_COUNT}
                                />
                              )}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 셔틀 여부 */}
                <div className="form-section space-y-3">
                  <div className="bg-surface border border-border-light rounded-xl px-4 py-3.5">
                    <Controller
                      name="shuttle.willRide"
                      control={control}
                      render={({ field }) => (
                        <Toggle
                          checked={field.value}
                          onChange={field.onChange}
                          label="셔틀버스 탑승 여부"
                        />
                      )}
                    />
                    <AnimatePresence>
                      {willRide && (
                        <motion.div
                          variants={slideDown}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="overflow-hidden"
                        >
                          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-light">
                            <p className="text-sm text-text-secondary">탑승 인원</p>
                            <Controller
                              name="shuttle.rideCount"
                              control={control}
                              render={({ field }) => (
                                <Stepper
                                  value={field.value}
                                  onChange={field.onChange}
                                  min={1}
                                  max={RSVP_VALIDATION.MAX_SHUTTLE_COUNT}
                                />
                              )}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            )}

            {/* 기타 전달사항 */}
            <div className="form-section space-y-2">
              <div className="flex items-center justify-between">
                <label className="form-label text-sm font-semibold text-text-primary">
                  기타 전달사항
                </label>
                <span className="text-xs text-text-tertiary">
                  {(noteValue ?? "").length} / {RSVP_VALIDATION.NOTE_MAX_LENGTH}
                </span>
              </div>
              <textarea
                {...register("note")}
                placeholder="전달하고 싶은 내용을 자유롭게 적어주세요"
                maxLength={RSVP_VALIDATION.NOTE_MAX_LENGTH}
                rows={3}
                className="form-textarea w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
              />
              {errors.note && (
                <p className="error-msg text-xs text-red-500">{errors.note.message}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 개인정보 동의 */}
      <div className="form-section">
        <label className="consent-row flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register("consent")}
            className="consent-checkbox mt-0.5 w-4 h-4 accent-primary flex-shrink-0 cursor-pointer"
          />
          <span className="text-xs text-text-secondary leading-relaxed">
            개인정보 수집 및 이용에 동의합니다.
            <br />
            <span className="text-text-tertiary">
              수집 항목: 성함, 연락처 / 보유기간: 결혼식 이후 30일
            </span>
          </span>
        </label>
        {errors.consent && (
          <p className="error-msg text-xs text-red-500 mt-1">{errors.consent.message}</p>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cancel-btn flex-1 py-3.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !consent}
          className="submit-btn flex-1 py-3.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isSubmitting ? "저장 중..." : isEdit ? "수정하기" : "참석 의사 전달하기"}
        </button>
      </div>
    </form>
  );
};
