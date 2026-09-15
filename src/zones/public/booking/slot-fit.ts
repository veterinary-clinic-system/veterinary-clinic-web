import { SlotStatus } from '@/types/enums';
import { SlotInfo } from '@/types/models';

export function slotFitsService(
  daySlots: SlotInfo[],
  slot: SlotInfo,
  durationMinutes: number,
): boolean {
  const start = new Date(slot.startAt).getTime();
  const end = start + durationMinutes * 60_000;

  const covered = daySlots
    .filter((other) => {
      const otherStart = new Date(other.startAt).getTime();
      const otherEnd = new Date(other.endAt).getTime();
      return otherStart < end && start < otherEnd;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  if (covered.length === 0) return false;
  if (new Date(covered[0].startAt).getTime() !== start) return false;
  if (new Date(covered[covered.length - 1].endAt).getTime() < end) return false;

  for (let i = 1; i < covered.length; i++) {
    if (new Date(covered[i].startAt).getTime() !== new Date(covered[i - 1].endAt).getTime()) {
      return false;
    }
  }

  return covered.every((other) => other.status === SlotStatus.FREE);
}
