import { ArrowLeft } from 'lucide-react';
import type { ThemeAccent } from '../types/app';
import { getThemePalette } from '../utils/theme';

interface StepProgressProps {
  currentStepIndex: number; // 1-based
  totalSteps: number;
  accent?: ThemeAccent;
}

/**
 * Small, strictly non-clickable orientation indicator.
 */
export function StepProgressIndicator({
  currentStepIndex,
  totalSteps,
  accent = 'rose-gold',
}: StepProgressProps) {
  const palette = getThemePalette(accent);

  return (
    <div
      className="pointer-events-none select-none fixed top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-full bg-[#130e17]/75 backdrop-blur-md border border-[#faf6f0]/10"
      aria-label={`Step ${currentStepIndex} of ${totalSteps}`}
    >
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, idx) => {
          const stepNum = idx + 1;
          const isCurrent = stepNum === currentStepIndex;
          const isPassed = stepNum < currentStepIndex;
          return (
            <span
              key={stepNum}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: isCurrent ? '18px' : '6px',
                backgroundColor: isCurrent
                  ? palette.primary
                  : isPassed
                    ? palette.secondary
                    : 'rgba(250, 246, 240, 0.22)',
              }}
            />
          );
        })}
      </div>
      <span className="font-mono-tabular text-[11px] text-[#faf6f0]/70">
        {currentStepIndex} / {totalSteps}
      </span>
    </div>
  );
}

interface StepFooterControlsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  disabledHint?: string;
  accent?: ThemeAccent;
}

export function StepFooterControls({
  onBack,
  onNext,
  nextLabel = 'Next 💕',
  nextDisabled = false,
  disabledHint,
  accent = 'rose-gold',
}: StepFooterControlsProps) {
  const palette = getThemePalette(accent);

  return (
    <div className="mt-12 sm:mt-16 flex flex-col items-center gap-4 pb-8">
      {nextDisabled && disabledHint && (
        <p className="text-xs text-[#d9b37c]/85 text-center">{disabledHint}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-[#faf6f0]/65 hover:text-[#faf6f0] border border-[#faf6f0]/12 hover:border-[#faf6f0]/28 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}

        {onNext && (
          <button
            type="button"
            disabled={nextDisabled}
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-[#120c14] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
            style={{
              backgroundColor: palette.primary,
              boxShadow: nextDisabled
                ? 'none'
                : `0 0 28px ${palette.glow}, 0 8px 24px rgba(0,0,0,0.45)`,
            }}
          >
            <span>{nextLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
