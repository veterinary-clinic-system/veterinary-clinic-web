import { SlotStatus } from '@/types/enums';

export const CELL_CLASSES: Record<SlotStatus, string> = {
  [SlotStatus.FREE]: 'border border-dashed border-border bg-surface text-muted',
  [SlotStatus.BOOKED]: 'border border-primary/40 bg-primary/5 text-left',
  [SlotStatus.BREAK]: 'border border-border bg-surface-muted text-muted',
  [SlotStatus.OFF_SHIFT]: 'border border-transparent bg-surface-muted/50 text-muted/60',

  [SlotStatus.PAST]: 'border border-transparent bg-surface-muted/50 text-muted/60',
};
