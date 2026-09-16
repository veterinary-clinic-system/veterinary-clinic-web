import { apiClient } from './client';
import {
  Appointment,
  AppointmentStatus,
  CommonSymptom,
  DayAvailability,
  MonthOverview,
  PaginatedResult,
} from '@/types/models';
import type { SepayQrTicket } from './billing.api';

export interface CreateBookingPayload {
  phone: string;
  ownerFullName?: string;
  email?: string;
  petId?: string;
  newPet?: {
    name: string;

    speciesId?: string;
    breedId: string;
    gender: string;
    weight?: number;
    birthDate?: string;
  };
  branchId: string;

  doctorId?: string;
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
  createPublicCheckout: (appointmentId: string, phone: string) =>
    apiClient
      .post<SepayQrTicket>(`/appointments/${appointmentId}/checkout`, { phone })
      .then((r) => r.data),
  createStaffBooking: (payload: CreateBookingPayload) =>
    apiClient.post<Appointment>('/appointments/staff', payload).then((r) => r.data),

  publicCalendar: (branchId: string, doctorId: string | undefined, weekOf?: string) =>
    apiClient
      .get<DayAvailability[]>('/appointments/calendar/public', {
        params: { branchId, doctorId: doctorId || undefined, weekOf },
      })
      .then((r) => r.data),

  ownerLookup: (phone: string) =>
    apiClient
      .get<{ found: boolean; fullName?: string }>('/appointments/owner-lookup', {
        params: { phone },
      })
      .then((r) => r.data),
  staffCalendar: (branchId: string, doctorId: string, weekOf?: string) =>
    apiClient
      .get<DayAvailability[]>('/appointments/calendar', { params: { branchId, doctorId, weekOf } })
      .then((r) => r.data),

  staffDayCalendar: (branchId: string, doctorId: string, date?: string) =>
    apiClient
      .get<DayAvailability>('/appointments/calendar/day', { params: { branchId, doctorId, date } })
      .then((r) => r.data),

  staffMonthCalendar: (branchId: string, doctorId: string | undefined, monthOf?: string) =>
    apiClient
      .get<MonthOverview>('/appointments/calendar/month', {
        params: { branchId, doctorId: doctorId || undefined, monthOf },
      })
      .then((r) => r.data),
  mine: () => apiClient.get<Appointment[]>('/appointments/mine').then((r) => r.data),
  list: (params: {
    page?: number;
    limit?: number;
    branchId?: string;
    doctorId?: string;
    status?: AppointmentStatus;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';

    date?: string;
  }) =>
    apiClient.get<PaginatedResult<Appointment>>('/appointments', { params }).then((r) => r.data),
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

  cancel: (id: string, reason: string) =>
    apiClient.post<Appointment>(`/appointments/${id}/cancel`, { reason }).then((r) => r.data),

  markNoShow: (id: string, reason?: string) =>
    apiClient.post<Appointment>(`/appointments/${id}/no-show`, { reason }).then((r) => r.data),

  doctorAbsence: (payload: {
    doctorId: string;

    date: string;
    reason?: string;

    reassign?: boolean;
  }) =>
    apiClient
      .post<{
        doctorBreakId: string;
        total: number;
        reassigned: { appointmentId: string; newDoctorId: string; newDoctorName: string }[];
        unresolved: {
          appointmentId: string;
          startAt: string;
          petName: string;
          ownerPhone: string;
        }[];
      }>('/appointments/doctor-absence', payload)
      .then((r) => r.data),
  scheduleFollowUp: (
    id: string,
    payload: { doctorId: string; branchId: string; serviceId: string; startAt: string },
  ) => apiClient.post<Appointment>(`/appointments/${id}/follow-up`, payload).then((r) => r.data),
};
