import { describe, expect, it } from 'vitest';
import { SlotStatus } from '@/types/enums';
import { SlotInfo } from '@/types/models';
import { slotFitsService } from './slot-fit';

const DATE = '2026-08-17';

/** Lưới một ngày làm việc thật: 07:00-11:00, nghỉ trưa, 13:30-17:30, ô 30 phút. */
function grid(): SlotInfo[] {
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const toHHmm = (mins: number) =>
    `${Math.floor(mins / 60)
      .toString()
      .padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;

  const slots: SlotInfo[] = [];
  for (const [open, close] of [
    ['07:00', '11:00'],
    ['13:30', '17:30'],
  ]) {
    for (let cursor = toMinutes(open); cursor + 30 <= toMinutes(close); cursor += 30) {
      const start = toHHmm(cursor);
      const end = toHHmm(cursor + 30);
      slots.push({
        start,
        end,
        startAt: `${DATE}T${start}:00`,
        endAt: `${DATE}T${end}:00`,
        status: SlotStatus.FREE,
      });
    }
  }
  return slots;
}

const at = (hhmm: string, slots: SlotInfo[]) => slots.find((s) => s.start === hhmm)!;

describe('slotFitsService', () => {
  it('nhận dịch vụ 30 phút trùng đúng một ô', () => {
    const slots = grid();
    expect(slotFitsService(slots, at('09:00', slots), 30)).toBe(true);
  });

  it('nhận dịch vụ 60 phút nằm gọn trong buổi làm việc', () => {
    const slots = grid();
    expect(slotFitsService(slots, at('09:00', slots), 60)).toBe(true);
  });

  /* Hai trường hợp dưới đây là lỗi đã tái hiện được trên API thật trước khi sửa. */
  it('từ chối dịch vụ 60 phút bắt đầu ở ô cuối ngày (17:00 -> 18:00)', () => {
    const slots = grid();
    expect(slotFitsService(slots, at('17:00', slots), 60)).toBe(false);
  });

  it('từ chối dịch vụ 60 phút đâm vào giờ nghỉ trưa (10:30 -> 11:30)', () => {
    const slots = grid();
    expect(slotFitsService(slots, at('10:30', slots), 60)).toBe(false);
  });

  it('từ chối dịch vụ dài nhảy QUA khe hở nghỉ trưa rồi đếm tiếp buổi chiều', () => {
    const slots = grid();
    // 10:30 + 240 phút = 14:30. Ô cuối có chạm 14:30, nhưng ở giữa đứt quãng.
    expect(slotFitsService(slots, at('10:30', slots), 240)).toBe(false);
  });

  it('từ chối khi một ô bị chiếm ở giữa khoảng', () => {
    const slots = grid();
    at('09:30', slots).status = SlotStatus.BOOKED;
    expect(slotFitsService(slots, at('09:00', slots), 60)).toBe(false);
  });

  it('từ chối ô đã qua dù thời lượng vừa đủ', () => {
    const slots = grid();
    at('09:00', slots).status = SlotStatus.PAST;
    expect(slotFitsService(slots, at('09:00', slots), 30)).toBe(false);
  });

  it('ô cuối ngày vẫn nhận dịch vụ 30 phút - vừa khít', () => {
    const slots = grid();
    expect(slotFitsService(slots, at('17:00', slots), 30)).toBe(true);
  });
});
