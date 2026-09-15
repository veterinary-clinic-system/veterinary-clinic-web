import { apiClient } from './client';
import {
  PaginatedResult,
  Vaccination,
  VaccinationDueRow,
  VaccinationRecordView,
  Vaccine,
} from '@/types/models';

export interface VaccineListParams {
  page?: number;
  limit?: number;
  active?: boolean;
  
  speciesId?: string;
  
  petId?: string;
}

export interface VaccinationPayload {
  petId: string;
  vaccineId: string;
  
  medicalRecordId?: string;
  branchId?: string;
  vaccinatedAt?: string;
  doseNumber?: number;
  
  nextDueDate?: string | null;
  notes?: string;
}

export const vaccinationsApi = {
  
  catalog: (params: VaccineListParams = {}) =>
    apiClient.get<PaginatedResult<Vaccine>>('/catalog/vaccines', { params }).then((r) => r.data),
  createVaccine: (payload: Record<string, unknown>) =>
    apiClient.post<Vaccine>('/catalog/vaccines', payload).then((r) => r.data),
  updateVaccine: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<Vaccine>(`/catalog/vaccines/${id}`, payload).then((r) => r.data),

  create: (payload: VaccinationPayload) =>
    apiClient.post<VaccinationRecordView>('/vaccinations', payload).then((r) => r.data),
  
  byPet: (petId: string) =>
    apiClient
      .get<VaccinationRecordView[]>(`/vaccinations/by-pet/${petId}`)
      .then((r) => r.data),
  byMedicalRecord: (medicalRecordId: string) =>
    apiClient
      .get<VaccinationRecordView[]>(`/vaccinations/by-medical-record/${medicalRecordId}`)
      .then((r) => r.data),
  
  due: (params: { days?: number; branchId?: string } = {}) =>
    apiClient.get<VaccinationDueRow[]>('/vaccinations/due', { params }).then((r) => r.data),
};

export type { Vaccination, VaccinationRecordView };
