import { apiClient } from './client';
import { PaginatedResult } from '@/types/models';

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
  
  readAt: string | null;
}

export const staffNotificationsApi = {
  list: (params: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiClient
      .get<PaginatedResult<StaffNotification>>('/staff-notifications', { params })
      .then((r) => r.data),
  
  unreadCount: () =>
    apiClient.get<{ unread: number }>('/staff-notifications/unread-count').then((r) => r.data),
  markRead: (id: string) =>
    apiClient.patch<StaffNotification>(`/staff-notifications/${id}/read`).then((r) => r.data),
  markAllRead: () =>
    apiClient.post<{ updated: number }>('/staff-notifications/read-all').then((r) => r.data),
};
