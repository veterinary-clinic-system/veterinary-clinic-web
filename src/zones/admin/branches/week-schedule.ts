import { OperatingHour } from '@/types/models';
import { formatTimeHHmm } from '@/utils/display';
import { CLINIC_WEEKDAYS } from '@/utils/opening-hours';

/**
 * Một ca trong ngày đang được sửa. `id` chỉ sống trong bộ nhớ của biểu mẫu (React cần
 * khoá ổn định cho hàng vừa thêm, mà hàng vừa thêm thì chưa có id của máy chủ) - nó
 * không bao giờ đi vào payload.
 */
export interface ScheduleBlock {
  id: string;
  openTime: string;
  closeTime: string;
}

/** Lịch cả tuần đang sửa, khoá theo `dayOfWeek`. Mảng rỗng nghĩa là ngày đó đóng cửa. */
export type WeekSchedule = Record<number, ScheduleBlock[]>;

let blockCounter = 0;

function nextBlockId(): string {
  blockCounter += 1;
  return `block-${blockCounter}`;
}

/**
 * Dựng lịch sửa được từ dữ liệu máy chủ - GIỮ NGUYÊN MỌI CA của mỗi ngày.
 *
 * Bản trước của màn hình này lấy `openingHours.find(h => h.dayOfWeek === d)`, tức là chỉ
 * thấy ca đầu tiên. Vì `PUT /branches/:id/opening-hours` thay cả tuần (xoá hết rồi chèn
 * lại), mở hộp thoại lên rồi bấm Lưu là ca chiều của mọi chi nhánh biến mất - và cùng
 * với nó là các khung giờ khách đặt được buổi chiều, vì `AvailabilityService` sinh khung
 * giờ từ chính bảng này. Dữ liệu thật có hai ca mỗi ngày: 07:00-11:00 và 13:30-17:30.
 */
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

/**
 * Ca mặc định khi bấm "Thêm ca": ca đầu là buổi sáng, ca thứ hai là buổi chiều sau giờ
 * nghỉ trưa. Đoán đúng ý người dùng trong đa số trường hợp thì họ chỉ phải sửa phút,
 * không phải gõ lại cả bốn con số.
 */
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

/**
 * Lỗi theo từng ca, khoá là `ScheduleBlock.id`.
 *
 * Kiểm ở client vì cả ba lỗi đều nói được ngay tại ô nhập, còn máy chủ chỉ trả về một
 * câu tiếng Anh cho cả tuần ("Invalid opening hours for day 3...") - người dùng phải tự
 * dò xem ngày nào sai. Việc chồng ca thì máy chủ KHÔNG kiểm: hai ca chồng nhau lọt qua
 * và làm khung giờ đặt lịch bị đếm hai lần.
 */
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

    /* Chồng ca: so từng cặp trong cùng một ngày, bỏ qua ca đã sai ở trên. */
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

/** Payload của `PUT /branches/:id/opening-hours`: cả tuần, mỗi ca một phần tử. */
export function toOpeningHoursPayload(schedule: WeekSchedule): Omit<OperatingHour, 'id'>[] {
  return CLINIC_WEEKDAYS.flatMap((day) =>
    (schedule[day] ?? []).map((block) => ({
      dayOfWeek: day,
      openTime: block.openTime,
      closeTime: block.closeTime,
    })),
  );
}
