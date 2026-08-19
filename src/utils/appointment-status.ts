import { BadgeVariant } from '@/components/basic';
import { AppointmentStatus } from '@/types/enums';

/**
 * Sắc thái màu cho từng trạng thái lịch hẹn - MỘT bảng dùng chung cho cả bốn zone.
 *
 * Trước đây mỗi màn hình tự chọn màu, nên "Đã huỷ" chỗ thì xám chỗ thì đỏ, và một lễ
 * tân chuyển giữa hai màn hình phải học lại bảng màu. Trạng thái là ngôn ngữ chung của
 * cả hệ thống; nó không được đổi nghĩa theo trang.
 *
 * Nhãn chữ vẫn luôn đi kèm (xem `APPOINTMENT_STATUS_LABEL_VI`) - màu chỉ giúp quét
 * nhanh, không mang thông tin nào của riêng nó.
 */
export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, BadgeVariant> = {
  [AppointmentStatus.PENDING]: 'warning',
  [AppointmentStatus.CONFIRMED]: 'info',
  [AppointmentStatus.CHECKED_IN]: 'info',
  [AppointmentStatus.IN_PROGRESS]: 'default',
  [AppointmentStatus.COMPLETED]: 'success',
  [AppointmentStatus.CANCELLED]: 'neutral',
  [AppointmentStatus.NO_SHOW]: 'destructive',
};

/** Ba nhóm mà chủ nuôi thật sự phân biệt khi nhìn danh sách lịch hẹn của mình. */
export type AppointmentGroup = 'upcoming' | 'completed' | 'cancelled';

export function appointmentGroupOf(status: AppointmentStatus): AppointmentGroup {
  if (status === AppointmentStatus.COMPLETED) return 'completed';
  if (status === AppointmentStatus.CANCELLED || status === AppointmentStatus.NO_SHOW) {
    return 'cancelled';
  }
  return 'upcoming';
}

/** Lịch hẹn còn huỷ được: chưa tới lượt khám và chưa kết thúc bất thường. */
export function canCancel(status: AppointmentStatus): boolean {
  return status === AppointmentStatus.PENDING || status === AppointmentStatus.CONFIRMED;
}
