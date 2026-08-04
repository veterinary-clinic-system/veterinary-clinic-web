import { apiClient } from './client';
import { CommonSymptom, PriorityColor, QueueEntry, QueueStatus } from '@/types/models';

export interface QueueListParams {
  branchId?: string;
  doctorId?: string;
  /** 'yyyy-MM-dd'. Bỏ trống = hàng chờ hôm nay. */
  date?: string;
  /** Bỏ trống = chỉ các lượt còn hoạt động (WAITING/ASSIGNED/IN_ROOM). */
  status?: QueueStatus[];
}

export interface CheckInPayload {
  appointmentId: string;
  priorityColor?: PriorityColor;
  note?: string;
}

export interface WalkInPayload {
  branchId: string;
  serviceId: string;
  doctorId?: string;
  phone: string;
  ownerFullName?: string;
  petId?: string;
  newPet?: {
    name: string;
    breedId: string;
    gender: string;
    weight?: number;
    birthDate?: string;
  };
  priorityColor?: PriorityColor;
  commonSymptoms?: CommonSymptom[];
  reason?: string;
  note?: string;
}

export const queueApi = {
  list: (params: QueueListParams = {}) =>
    apiClient
      .get<QueueEntry[]>('/queue', {
        params,
        // `status` là mảng: axios mặc định serialize thành `status[]=A&status[]=B`,
        // còn DTO ở backend đọc `status=A&status=B` (hoặc `status=A,B`).
        paramsSerializer: { indexes: null },
      })
      .then((r) => r.data),
  getOne: (id: string) => apiClient.get<QueueEntry>(`/queue/${id}`).then((r) => r.data),
  checkIn: (payload: CheckInPayload) =>
    apiClient.post<QueueEntry>('/queue/check-in', payload).then((r) => r.data),
  walkIn: (payload: WalkInPayload) =>
    apiClient.post<QueueEntry>('/queue/walk-in', payload).then((r) => r.data),
  assignDoctor: (id: string, payload: { doctorId: string; startAt?: string }) =>
    apiClient.patch<QueueEntry>(`/queue/${id}/assign`, payload).then((r) => r.data),
  update: (
    id: string,
    payload: { status?: QueueStatus; priorityColor?: PriorityColor; note?: string },
  ) => apiClient.patch<QueueEntry>(`/queue/${id}`, payload).then((r) => r.data),
};
