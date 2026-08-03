import { apiClient } from './client';
import { Appointment, AppointmentStatus, CommonSymptom, DayAvailability, PaginatedResult } from '@/types/models';

export interface CreateBookingPayload {
  phone: string;
  ownerFullName?: string;
  email?: string;
  petId?: string;
  newPet?: {
    name: string;
    breedId: string;
    gender: string;
    weight?: number;
    birthDate?: string;
  };
  branchId: string;
  doctorId: string;
  serviceId: string;
  startAt: string;
  commonSymptoms?: CommonSymptom[];
  otherSymptoms?: string;
  photoUrls?: string[];
  address?: string;
}

export const appointmentsApi = {
  createPublicBooking: (payload: CreateBookingPayload) =>
    apiClient.post<Appointment>('/appointments', payload).then((r) => r.data),
  createStaffBooking: (payload: CreateBookingPayload) =>
    apiClient.post<Appointment>('/appointments/staff', payload).then((r) => r.data),
  publicCalendar: (branchId: string, doctorId: string, weekOf?: string) =>
    apiClient
      .get<DayAvailability[]>('/appointments/calendar/public', { params: { branchId, doctorId, weekOf } })
      .then((r) => r.data),
  staffCalendar: (branchId: string, doctorId: string, weekOf?: string) =>
    apiClient
      .get<DayAvailability[]>('/appointments/calendar', { params: { branchId, doctorId, weekOf } })
      .then((r) => r.data),
  mine: () => apiClient.get<Appointment[]>('/appointments/mine').then((r) => r.data),
  list: (params: {
    page?: number;
    limit?: number;
    branchId?: string;
    doctorId?: string;
    status?: AppointmentStatus;
  }) => apiClient.get<PaginatedResult<Appointment>>('/appointments', { params }).then((r) => r.data),
  getOne: (id: string) => apiClient.get<Appointment>(`/appointments/${id}`).then((r) => r.data),
  update: (
    id: string,
    payload: Partial<{
      doctorId: string;
      startAt: string;
      status: AppointmentStatus;
      priorityColor: string;
      notes: string;
    }>,
  ) => apiClient.patch<Appointment>(`/appointments/${id}`, payload).then((r) => r.data),
  cancel: (id: string) => apiClient.post<Appointment>(`/appointments/${id}/cancel`).then((r) => r.data),
  scheduleFollowUp: (
    id: string,
    payload: { doctorId: string; branchId: string; serviceId: string; startAt: string },
  ) => apiClient.post<Appointment>(`/appointments/${id}/follow-up`, payload).then((r) => r.data),
};
