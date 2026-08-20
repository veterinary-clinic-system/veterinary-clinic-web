import { describe, expect, it } from 'vitest';
import { OperatingHour } from '@/types/models';
import {
  addBlock,
  removeBlock,
  toOpeningHoursPayload,
  toWeekSchedule,
  validateWeekSchedule,
} from './week-schedule';

/** Lịch thật của dữ liệu seed: hai ca mỗi ngày, Thứ Hai đến Thứ Sáu. */
function seedHours(): OperatingHour[] {
  return [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
    { id: `${dayOfWeek}-am`, dayOfWeek, openTime: '07:00', closeTime: '11:00' },
    { id: `${dayOfWeek}-pm`, dayOfWeek, openTime: '13:30', closeTime: '17:30' },
  ]);
}

describe('week-schedule', () => {
  it('giữ đủ hai ca mỗi ngày qua một vòng đọc - ghi', () => {
    /*
      Đây là bài kiểm cho lỗi mất dữ liệu của bản trước: nó chỉ đọc ca ĐẦU TIÊN của mỗi
      ngày rồi gửi lại năm dòng, mà `PUT /branches/:id/opening-hours` thay cả tuần - nên
      mở hộp thoại lên bấm Lưu là ca chiều biến mất khỏi mọi chi nhánh.
    */
    const payload = toOpeningHoursPayload(toWeekSchedule(seedHours()));

    expect(payload).toHaveLength(10);
    expect(payload.filter((row) => row.dayOfWeek === 1)).toEqual([
      { dayOfWeek: 1, openTime: '07:00', closeTime: '11:00' },
      { dayOfWeek: 1, openTime: '13:30', closeTime: '17:30' },
    ]);
  });

  it('cắt giây khỏi giờ máy chủ trả về', () => {
    const schedule = toWeekSchedule([
      { id: 'a', dayOfWeek: 2, openTime: '08:00:00', closeTime: '12:00:00' },
    ]);

    expect(schedule[2]).toEqual([{ id: expect.any(String), openTime: '08:00', closeTime: '12:00' }]);
  });

  it('bỏ qua ngày cuối tuần máy chủ không nhận', () => {
    const schedule = toWeekSchedule([
      { id: 'a', dayOfWeek: 0, openTime: '08:00', closeTime: '12:00' },
      { id: 'b', dayOfWeek: 6, openTime: '08:00', closeTime: '12:00' },
    ]);

    expect(toOpeningHoursPayload(schedule)).toEqual([]);
  });

  it('ngày không còn ca nào thì biến mất khỏi payload - đó là ngày đóng cửa', () => {
    let schedule = toWeekSchedule(seedHours());
    schedule[3].forEach((block) => {
      schedule = removeBlock(schedule, 3, block.id);
    });

    const payload = toOpeningHoursPayload(schedule);
    expect(payload).toHaveLength(8);
    expect(payload.some((row) => row.dayOfWeek === 3)).toBe(false);
  });

  it('ca thêm mới không đè lên ca sáng đã có', () => {
    const schedule = addBlock(toWeekSchedule([]), 1);
    const withAfternoon = addBlock(schedule, 1);

    expect(toOpeningHoursPayload(withAfternoon)).toEqual([
      { dayOfWeek: 1, openTime: '07:00', closeTime: '11:00' },
      { dayOfWeek: 1, openTime: '13:30', closeTime: '17:30' },
    ]);
    expect(validateWeekSchedule(withAfternoon)).toEqual({});
  });

  it('bắt giờ mở muộn hơn giờ đóng', () => {
    const schedule = toWeekSchedule([
      { id: 'a', dayOfWeek: 1, openTime: '17:00', closeTime: '09:00' },
    ]);
    const blockId = schedule[1][0].id;

    expect(validateWeekSchedule(schedule)[blockId]).toBe('Giờ mở phải sớm hơn giờ đóng.');
  });

  it('bắt hai ca trùng giờ trong cùng một ngày - máy chủ không kiểm việc này', () => {
    const schedule = toWeekSchedule([
      { id: 'a', dayOfWeek: 4, openTime: '08:00', closeTime: '12:00' },
      { id: 'b', dayOfWeek: 4, openTime: '11:00', closeTime: '15:00' },
    ]);

    const errors = validateWeekSchedule(schedule);
    expect(Object.keys(errors)).toHaveLength(2);
    expect(Object.values(errors)[0]).toContain('trùng giờ');
  });

  it('hai ca sát nhau nhưng không chồng nhau là hợp lệ', () => {
    const schedule = toWeekSchedule([
      { id: 'a', dayOfWeek: 5, openTime: '08:00', closeTime: '12:00' },
      { id: 'b', dayOfWeek: 5, openTime: '12:00', closeTime: '17:00' },
    ]);

    expect(validateWeekSchedule(schedule)).toEqual({});
  });

  it('lịch seed đầy đủ không có lỗi nào', () => {
    expect(validateWeekSchedule(toWeekSchedule(seedHours()))).toEqual({});
  });
});
