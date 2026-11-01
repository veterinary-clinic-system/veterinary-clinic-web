import { describe, expect, it } from 'vitest';

import { AppointmentStatus } from '@/types/enums';

import { appointmentGroupOf } from './appointment-status';

describe('appointmentGroupOf', () => {
  const now = new Date(2026, 10, 1, 8, 0);

  it('lịch chờ/đã xác nhận của ngày trước không còn là "sắp tới"', () => {
    const lastWeek = new Date(2026, 9, 27, 16, 0).toISOString();
    expect(appointmentGroupOf(AppointmentStatus.PENDING, lastWeek, now)).toBe('cancelled');
    expect(appointmentGroupOf(AppointmentStatus.CONFIRMED, lastWeek, now)).toBe('cancelled');
  });

  it('lịch sáng sớm hôm nay vẫn là "sắp tới" dù giờ đã qua', () => {
    const earlyToday = new Date(2026, 10, 1, 7, 0).toISOString();
    expect(appointmentGroupOf(AppointmentStatus.CONFIRMED, earlyToday, now)).toBe('upcoming');
  });

  it('nhóm theo trạng thái kết thúc không đổi', () => {
    const lastWeek = new Date(2026, 9, 27, 16, 0).toISOString();
    expect(appointmentGroupOf(AppointmentStatus.COMPLETED, lastWeek, now)).toBe('completed');
    expect(appointmentGroupOf(AppointmentStatus.NO_SHOW, lastWeek, now)).toBe('cancelled');
  });
});
