import type { FC } from "react";
import type {
  UseFormRegister,
  Control,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowForwardOutline, IoCheckmarkCircleOutline } from "react-icons/io5";
import type { WeddingFormData } from "../types.ts";
import type { WeddingImagesState, WeddingImagesActions } from "../hooks/useWeddingImages.ts";
import { StepIndicator } from "./StepIndicator.tsx";
import { BasicInfoStep } from "./BasicInfoStep.tsx";
import { CoupleStep } from "./CoupleStep.tsx";
import { ScheduleStep } from "./ScheduleStep.tsx";
import { AccountStep } from "./AccountStep.tsx";
import { ExtraInfoStep } from "./ExtraInfoStep.tsx";

interface WeddingFormLayoutProps {
  title: string;
  step: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  register: UseFormRegister<WeddingFormData>;
  control: Control<WeddingFormData>;
  errors: FieldErrors<WeddingFormData>;
  setValue: UseFormSetValue<WeddingFormData>;
  venueLat: number | null;
  venueLng: number | null;
  images: WeddingImagesState & WeddingImagesActions;
}

export const WeddingFormLayout: FC<WeddingFormLayoutProps> = ({
  title, step, totalSteps,
  onStepClick, onNext, onPrev, onSubmit,
  isSubmitting, submitLabel,
  register, control, errors, setValue,
  venueLat, venueLng,
  images,
}) => (
  <div className="min-h-screen bg-bg-secondary">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-lg mx-auto p-6"
    >
      <h1 className="text-xl font-bold text-text-primary mb-6 text-center">{title}</h1>

      <StepIndicator currentStep={step} onStepClick={onStepClick} />

      <form onSubmit={(e) => e.preventDefault()} className="bg-bg-primary rounded-2xl shadow-sm border border-border p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <BasicInfoStep
                register={register}
                errors={errors}
                heroImages={images.heroImages}
                onHeroImagesChange={images.setHeroImages}
                setValue={setValue}
                venueLat={venueLat}
                venueLng={venueLng}
                existingHeroUrls={images.existingHeroUrls}
                onRemoveExistingHero={images.removeExistingHeroUrl}
              />
            )}
            {step === 1 && (
              <CoupleStep
                register={register}
                control={control}
                errors={errors}
                groomProfileImage={images.groomProfileImage}
                brideProfileImage={images.brideProfileImage}
                onGroomImageChange={images.setGroomProfileImage}
                onBrideImageChange={images.setBrideProfileImage}
                groomPreviewUrl={images.groomPreviewUrl}
                bridePreviewUrl={images.bridePreviewUrl}
              />
            )}
            {step === 2 && (
              <ScheduleStep control={control} errors={errors} register={register} />
            )}
            {step === 3 && (
              <AccountStep control={control} errors={errors} register={register} setValue={setValue} />
            )}
            {step === 4 && (
              <ExtraInfoStep control={control} errors={errors} register={register} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              type="button"
              onClick={onPrev}
              className="flex-1 py-3 border border-border text-text-secondary font-medium rounded-xl hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              이전
            </button>
          )}

          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={() => onNext()}
              className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              다음
              <IoArrowForwardOutline size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onSubmit}
              className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <IoCheckmarkCircleOutline size={18} />
                  {submitLabel}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </motion.div>
  </div>
);
