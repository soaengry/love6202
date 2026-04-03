import type { FC } from "react";

const STEP_LABELS = ["기본 정보", "신랑신부", "식순", "계좌 정보", "추가 정보"];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const StepIndicator: FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="mb-8">
      {/* 원형 인디케이터 + 연결선 */}
      <div className="flex items-center justify-center gap-1">
        {STEP_LABELS.map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (i < currentStep && onStepClick) onStepClick(i);
              }}
              disabled={i > currentStep}
              className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                i === currentStep
                  ? "bg-primary text-white"
                  : i < currentStep
                    ? "bg-primary/20 text-primary cursor-pointer"
                    : "bg-bg-tertiary text-text-tertiary"
              }`}
            >
              {i + 1}
            </button>
            {i < STEP_LABELS.length - 1 && (
              <div className={`step-connector w-6 h-0.5 ${i < currentStep ? "bg-primary/30" : "bg-bg-tertiary"}`} />
            )}
          </div>
        ))}
      </div>
      {/* 스텝 이름 */}
      <p className="step-label text-center text-sm text-text-secondary mt-3">{STEP_LABELS[currentStep]}</p>
    </div>
  );
}
