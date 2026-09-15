import { OperatingHour } from '@/types/models';
import { formatTimeHHmm } from '@/utils/display';
import { CLINIC_WEEKDAYS } from '@/utils/opening-hours';

export interface ScheduleBlock {
  id: string;
  openTime: string;
  closeTime: string;
}

export type WeekSchedule = Record<number, ScheduleBlock[]>;

let blockCounter = 0;

function nextBlockId(): string {
  blockCounter += 1;
  return `block-${blockCounter}`;
}

export function toWeekSchedule(hours: OperatingHour[] | undefined): WeekSchedule {
  const schedule: WeekSchedule = {};
  CLINIC_WEEKDAYS.forEach((day) => {
    schedule[day] = [];
  });

  [...(hours ?? [])]
    .filter((hour) => CLINIC_WEEKDAYS.includes(hour.dayOfWeek))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.openTime.localeCompare(b.openTime))
    .forEach((hour) => {
      schedule[hour.dayOfWeek].push({
        id: nextBlockId(),
        openTime: formatTimeHHmm(hour.openTime),
        closeTime: formatTimeHHmm(hour.closeTime),
      });
    });

  return schedule;
}

export function defaultBlockFor(existing: ScheduleBlock[]): ScheduleBlock {
  return existing.length === 0
    ? { id: nextBlockId(), openTime: '07:00', closeTime: '11:00' }
    : { id: nextBlockId(), openTime: '13:30', closeTime: '17:30' };
}

export function addBlock(schedule: WeekSchedule, day: number): WeekSchedule {
  const existing = schedule[day] ?? [];
  return { ...schedule, [day]: [...existing, defaultBlockFor(existing)] };
}

export function removeBlock(schedule: WeekSchedule, day: number, blockId: string): WeekSchedule {
  return { ...schedule, [day]: (schedule[day] ?? []).filter((block) => block.id !== blockId) };
}

export function updateBlock(
  schedule: WeekSchedule,
  day: number,
  blockId: string,
  patch: Partial<Pick<ScheduleBlock, 'openTime' | 'closeTime'>>,
): WeekSchedule {
  return {
    ...schedule,
    [day]: (schedule[day] ?? []).map((block) =>
      block.id === blockId ? { ...block, ...patch } : block,
    ),
  };
}

export function validateWeekSchedule(schedule: WeekSchedule): Record<string, string> {
  const errors: Record<string, string> = {};

  CLINIC_WEEKDAYS.forEach((day) => {
    const blocks = schedule[day] ?? [];

    blocks.forEach((block) => {
      if (!block.openTime || !block.closeTime) {
        errors[block.id] = 'Chưa nhập đủ giờ mở và giờ đóng.';
        return;
      }
      if (block.openTime >= block.closeTime) {
        errors[block.id] = 'Giờ mở phải sớm hơn giờ đóng.';
      }
    });

    blocks.forEach((block, index) => {
      if (errors[block.id]) return;
      const overlapped = blocks.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.openTime &&
          other.closeTime &&
          other.openTime < block.closeTime &&
          block.openTime < other.closeTime,
      );
      if (overlapped) {
        errors[block.id] = 'Ca này trùng giờ với một ca khác trong cùng ngày.';
      }
    });
  });

  return errors;
}

export function toOpeningHoursPayload(schedule: WeekSchedule): Omit<OperatingHour, 'id'>[] {
  return CLINIC_WEEKDAYS.flatMap((day) =>
    (schedule[day] ?? []).map((block) => ({
      dayOfWeek: day,
      openTime: block.openTime,
      closeTime: block.closeTime,
    })),
  );
}
