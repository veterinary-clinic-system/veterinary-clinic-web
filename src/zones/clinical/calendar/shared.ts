import { SlotStatus } from '@/types/enums';

export const CELL_CLASSES: Record<SlotStatus, string> = {
  [SlotStatus.FREE]: 'border border-dashed border-border bg-surface text-muted',
  [SlotStatus.BOOKED]: 'border border-primary/40 bg-primary/5 text-left',
  [SlotStatus.BREAK]: 'border border-border bg-surface-muted text-muted',
  [SlotStatus.OFF_SHIFT]: 'border border-transparent bg-surface-muted/50 text-muted/60',
  // Lịch nhân viên không nhận `PAST` từ backend (chỉ lịch công khai mới bị hạ trạng
  // thái), nhưng `Record` đòi đủ khoá — và nếu có thì trông như ngoài giờ làm.
  [SlotStatus.PAST]: 'border border-transparent bg-surface-muted/50 text-muted/60',
};
