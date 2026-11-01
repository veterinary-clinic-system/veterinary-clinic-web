import { BadgeVariant } from '@/components/basic';
import { AppointmentStatus } from '@/types/enums';

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, BadgeVariant> = {
  [AppointmentStatus.PENDING]: 'warning',
  [AppointmentStatus.CONFIRMED]: 'info',
  [AppointmentStatus.CHECKED_IN]: 'info',
  [AppointmentStatus.IN_PROGRESS]: 'default',
  [AppointmentStatus.COMPLETED]: 'success',
  [AppointmentStatus.CANCELLED]: 'neutral',
  [AppointmentStatus.NO_SHOW]: 'destructive',
};

export type AppointmentGroup = 'upcoming' | 'completed' | 'cancelled';

/**
 * Lịch PENDING/CONFIRMED của những ngày trước không còn là "sắp tới": backend tự huỷ hoặc
 * đánh dấu không đến mỗi giờ, ở đây xếp trước vào nhóm huỷ cho khỏi lệch trong lúc chờ.
 */
export function appointmentGroupOf(
  status: AppointmentStatus,
  startAt: string,
  now: Date = new Date(),
): AppointmentGroup {
  if (status === AppointmentStatus.COMPLETED) return 'completed';
  if (status === AppointmentStatus.CANCELLED || status === AppointmentStatus.NO_SHOW) {
    return 'cancelled';
  }
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const missed =
    (status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED) &&
    new Date(startAt) < startOfToday;
  return missed ? 'cancelled' : 'upcoming';
}

export function canCancel(status: AppointmentStatus): boolean {
  return status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED;
}
