import { Icon, cn } from '@/components/basic';
import { STEP_LABELS, Step } from './types';

export interface BookingStepperProps {
  current: Step;
  
  onGoToStep?: (step: Step) => void;
}

export function BookingStepper({ current, onGoToStep }: BookingStepperProps) {
  return (
    <ol
      aria-label={`Tiến trình đặt lịch - bước ${current} trên ${STEP_LABELS.length}`}
      className="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2"
    >
      {STEP_LABELS.map((label, index) => {
        const stepNumber = (index + 1) as Step;
        const isActive = stepNumber === current;
        const isDone = stepNumber < current;
        const clickable = isDone && Boolean(onGoToStep);

        const content = (
          <>
            <span aria-hidden="true" className="font-semibold tabular-nums">
              {isDone ? <Icon name="check" className="h-3.5 w-3.5" /> : stepNumber}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </>
        );

        const className = cn(
          'flex min-h-touch items-center gap-1.5 rounded-full px-3',
          isActive
            ? 'bg-primary font-medium text-primary-foreground'
            : isDone
              ? 'bg-primary/10 text-primary'
              : 'bg-surface-muted text-muted',
          clickable && 'transition-colors hover:bg-primary/20',
        );

        return (
          <li key={label} aria-current={isActive ? 'step' : undefined}>
            {clickable ? (
              <button
                type="button"
                onClick={() => onGoToStep?.(stepNumber)}
                aria-label={`Quay lại bước ${stepNumber}: ${label}`}
                className={className}
              >
                {content}
              </button>
            ) : (
              <span aria-label={`Bước ${stepNumber}: ${label}`} className={className}>
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
