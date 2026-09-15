import { apiClient } from './client';
import {
  LabQueueRow,
  LabResultFlag,
  LabTestOrder,
  LabTestStatus,
  LabTrendSeries,
} from '@/types/models';

export interface LaboratoryResultPayload {
  parameter: string;
  value: number;
  unit?: string;
  referenceMin?: number | null;
  referenceMax?: number | null;
  
  flag?: LabResultFlag;
  note?: string;
}

export interface SaveLaboratoryResultsPayload {
  results: LaboratoryResultPayload[];
  resultDate?: string;
  
  resultText?: string;
}

export const laboratoriesApi = {
  
  queue: (params: { status?: LabTestStatus; branchId?: string } = {}) =>
    apiClient.get<LabQueueRow[]>('/laboratories/queue', { params }).then((r) => r.data),
  getOrder: (id: string) =>
    apiClient.get<LabTestOrder>(`/laboratories/orders/${id}`).then((r) => r.data),
  byMedicalRecord: (medicalRecordId: string) =>
    apiClient
      .get<LabTestOrder[]>(`/laboratories/by-medical-record/${medicalRecordId}`)
      .then((r) => r.data),
  byPet: (petId: string) =>
    apiClient.get<LabTestOrder[]>(`/laboratories/by-pet/${petId}`).then((r) => r.data),
  
  parameters: (petId: string) =>
    apiClient.get<string[]>(`/laboratories/by-pet/${petId}/parameters`).then((r) => r.data),
  
  trends: (petId: string, parameter: string) =>
    apiClient
      .get<LabTrendSeries>(`/laboratories/by-pet/${petId}/trends`, { params: { parameter } })
      .then((r) => r.data),
  saveResults: (labTestOrderId: string, payload: SaveLaboratoryResultsPayload) =>
    apiClient
      .put<LabTestOrder>(`/laboratories/orders/${labTestOrderId}/results`, payload)
      .then((r) => r.data),
};
