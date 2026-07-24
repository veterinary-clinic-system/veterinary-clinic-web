import { apiClient } from './client';
import { Branch, OperatingHour } from '@/types/models';

export const branchesApi = {
  list: () => apiClient.get<Branch[]>('/branches').then((r) => r.data),
  listAll: () => apiClient.get<Branch[]>('/branches/admin').then((r) => r.data),
  getOne: (id: string) => apiClient.get<Branch>(`/branches/${id}`).then((r) => r.data),
  create: (payload: { branchName: string; phone: string; description?: string; address: string }) =>
    apiClient.post<Branch>('/branches', payload).then((r) => r.data),
  update: (id: string, payload: Partial<Branch>) =>
    apiClient.patch<Branch>(`/branches/${id}`, payload).then((r) => r.data),
  setOpeningHours: (id: string, hours: Omit<OperatingHour, 'id'>[]) =>
    apiClient.put(`/branches/${id}/opening-hours`, hours).then((r) => r.data),
};
