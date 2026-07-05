import type { FC } from "react";

const STEP_LABELS = ["기본 정보", "신랑신부", "식순", "계좌 정보", "추가 정보"];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  hiddenSteps?: number[];
}

export const StepIndicator: FC<StepIndicatorProps> = ({ currentStep, onStepClick, hiddenSteps = [] }) => {
  const visibleSteps = STEP_LABELS.map((_, i) => i).filter((i) => !hiddenSteps.includes(i));

  return (
    <div className="mb-8">
      {/* 원형 인디케이터 + 연결선 */}
      <div className="flex items-center justify-center gap-1">
        {visibleSteps.map((actualIndex, displayPos) => (
          <div key={actualIndex} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (actualIndex < currentStep && onStepClick) onStepClick(actualIndex);
              }}
              disabled={actualIndex > currentStep}
              className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                actualIndex === currentStep
                  ? "bg-primary text-white"
                  : actualIndex < currentStep
                    ? "bg-primary/20 text-primary cursor-pointer"
                    : "bg-bg-tertiary text-text-tertiary"
              }`}
            >
              {displayPos + 1}
            </button>
            {displayPos < visibleSteps.length - 1 && (
              <div className={`step-connector w-6 h-0.5 ${actualIndex < currentStep ? "bg-primary/30" : "bg-bg-tertiary"}`} />
            )}
          </div>
        ))}
      </div>
      {/* 스텝 이름 */}
      <p className="step-label text-center text-sm text-text-secondary mt-3">{STEP_LABELS[currentStep]}</p>
    </div>
  );
}
