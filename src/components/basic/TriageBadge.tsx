import { PriorityColor, PRIORITY_COLOR_LABEL_VI } from '@/types/enums';
import { cn } from './utils';

export interface TriageBadgeProps {
  color: PriorityColor;
  className?: string;
}

const COLOR_CLASSES: Record<PriorityColor, string> = {
  [PriorityColor.RED]: 'bg-triage-red/10 text-triage-red',
  [PriorityColor.ORANGE]: 'bg-triage-orange/10 text-triage-orange',
  [PriorityColor.YELLOW]: 'bg-triage-yellow/10 text-triage-yellow',
  [PriorityColor.GREEN]: 'bg-triage-green/10 text-triage-green',
  [PriorityColor.BLUE]: 'bg-triage-blue/10 text-triage-blue',
};

const DOT_CLASSES: Record<PriorityColor, string> = {
  [PriorityColor.RED]: 'bg-triage-red',
  [PriorityColor.ORANGE]: 'bg-triage-orange',
  [PriorityColor.YELLOW]: 'bg-triage-yellow',
  [PriorityColor.GREEN]: 'bg-triage-green',
  [PriorityColor.BLUE]: 'bg-triage-blue',
};

/** The 5-color AI pre-screening priority scale. Label text is sourced from PRIORITY_COLOR_LABEL_VI (src/types/enums.ts), not redefined here. */
export function TriageBadge({ color, className }: TriageBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium',
        COLOR_CLASSES[color],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASSES[color])} aria-hidden="true" />
      {PRIORITY_COLOR_LABEL_VI[color]}
    </span>
  );
}
