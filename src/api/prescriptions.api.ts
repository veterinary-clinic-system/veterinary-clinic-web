import { apiClient } from './client';
import {
  MedicationRoute,
  PaginatedResult,
  Prescription,
  PrescriptionStatus,
  PrescriptionView,
} from '@/types/models';

export interface PrescriptionListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: PrescriptionStatus;
  petId?: string;
  medicalRecordId?: string;
  branchId?: string;
}

export interface PrescriptionItemPayload {
  medicationId: string;
  
  quantity: number;
  dosage: string;
  frequency?: string;
  durationDays: number;
  route?: MedicationRoute;
  instructions?: string;
}

export interface PrescriptionPayload {
  medicalRecordId: string;
  notes?: string;
  items: PrescriptionItemPayload[];
}

export const prescriptionsApi = {
  
  list: (params: PrescriptionListParams = {}) =>
    apiClient.get<PaginatedResult<Prescription>>('/prescriptions', { params }).then((r) => r.data),
  getOne: (id: string) =>
    apiClient.get<PrescriptionView>(`/prescriptions/${id}`).then((r) => r.data),
  create: (payload: PrescriptionPayload) =>
    apiClient.post<PrescriptionView>('/prescriptions', payload).then((r) => r.data),
  
  update: (id: string, payload: Partial<Omit<PrescriptionPayload, 'medicalRecordId'>>) =>
    apiClient.patch<PrescriptionView>(`/prescriptions/${id}`, payload).then((r) => r.data),
  
  startDispensing: (id: string) =>
    apiClient.post<PrescriptionView>(`/prescriptions/${id}/start-dispense`, {}).then((r) => r.data),
  
  dispense: (id: string) =>
    apiClient.post<PrescriptionView>(`/prescriptions/${id}/dispense`, {}).then((r) => r.data),
  cancel: (id: string) =>
    apiClient.post<PrescriptionView>(`/prescriptions/${id}/cancel`, {}).then((r) => r.data),
};
