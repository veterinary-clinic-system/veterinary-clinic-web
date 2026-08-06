import { apiClient } from './client';
import { PaginatedResult } from '@/types/models';

/** Bảy loại sự kiện của bảng mục 18 SRS — khớp `StaffNotificationType` phía backend. */
export type StaffNotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'PAYMENT_FAILED'
  | 'APPOINTMENT_CANCELLED'
  | 'VACCINATION_DUE';

export interface StaffNotification {
  id: string;
  createdAt: string;
  type: StaffNotificationType;
  title: string;
  body: string;
  link: string | null;
  branchId: string | null;
  /** `null` = chưa đọc. */
  readAt: string | null;
}

export const staffNotificationsApi = {
  list: (params: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiClient
      .get<PaginatedResult<StaffNotification>>('/staff-notifications', { params })
      .then((r) => r.data),
  /** Endpoint riêng chỉ trả một con số — chuông gọi nó định kỳ nên nó phải rẻ. */
  unreadCount: () =>
    apiClient.get<{ unread: number }>('/staff-notifications/unread-count').then((r) => r.data),
  markRead: (id: string) =>
    apiClient.patch<StaffNotification>(`/staff-notifications/${id}/read`).then((r) => r.data),
  markAllRead: () =>
    apiClient.post<{ updated: number }>('/staff-notifications/read-all').then((r) => r.data),
};
