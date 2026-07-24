import { apiClient } from './client';
import { PaginatedResult, StaffUser } from '@/types/models';

export interface DoctorPublic {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  yearOfStart: number | null;
  specialization: string[];
  branch: { id: string; branchName: string };
}

export interface DoctorShift {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface DoctorBreak {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
}

export const doctorsApi = {
  listPublic: (branchId?: string) =>
    apiClient.get<DoctorPublic[]>('/users/doctors', { params: { branchId } }).then((r) => r.data),
  getOnePublic: (id: string) => apiClient.get<DoctorPublic>(`/users/doctors/${id}`).then((r) => r.data),
  getShifts: (doctorId: string) =>
    apiClient.get<DoctorShift[]>(`/users/doctors/${doctorId}/shifts`).then((r) => r.data),
  createShift: (doctorId: string, payload: { dayOfWeek: number; startTime: string; endTime: string }) =>
    apiClient.post<DoctorShift>(`/users/doctors/${doctorId}/shifts`, payload).then((r) => r.data),
  deleteShift: (shiftId: string) => apiClient.delete(`/users/doctors/shifts/${shiftId}`),
  getBreaks: (doctorId: string, date?: string) =>
    apiClient
      .get<DoctorBreak[]>(`/users/doctors/${doctorId}/breaks`, { params: { date } })
      .then((r) => r.data),
  createBreak: (doctorId: string, payload: { date: string; startTime: string; endTime: string; reason?: string }) =>
    apiClient.post<DoctorBreak>(`/users/doctors/${doctorId}/breaks`, payload).then((r) => r.data),
};

export const usersApi = {
  me: () => apiClient.get<StaffUser>('/users/me').then((r) => r.data),
  updatePassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch('/users/me/password', { currentPassword, newPassword }),
  list: (params: { page?: number; limit?: number; role?: string; branchId?: string }) =>
    apiClient.get<PaginatedResult<StaffUser>>('/users', { params }).then((r) => r.data),
  create: (payload: Record<string, unknown>) =>
    apiClient.post<StaffUser>('/users', payload).then((r) => r.data),
  update: (id: string, payload: Partial<StaffUser>) =>
    apiClient.patch<StaffUser>(`/users/${id}`, payload).then((r) => r.data),
  searchPetOwners: (search: string) =>
    apiClient.get<PaginatedResult<StaffUser>>('/users/pet-owners', { params: { search } }).then((r) => r.data),
};
