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

export function appointmentGroupOf(status: AppointmentStatus): AppointmentGroup {
  if (status === AppointmentStatus.COMPLETED) return 'completed';
  if (status === AppointmentStatus.CANCELLED || status === AppointmentStatus.NO_SHOW) {
    return 'cancelled';
  }
  return 'upcoming';
}

export function canCancel(status: AppointmentStatus): boolean {
  return status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED;
}
