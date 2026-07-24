import { apiClient } from './client';
import { Examination, LabTestOrder, Prescription } from '@/types/models';

export const examinationsApi = {
  create: (payload: Record<string, unknown>) =>
    apiClient.post<Examination>('/examinations', payload).then((r) => r.data),
  update: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<Examination>(`/examinations/${id}`, payload).then((r) => r.data),
  getByAppointment: (appointmentId: string) =>
    apiClient.get<Examination>(`/examinations/by-appointment/${appointmentId}`).then((r) => r.data),
  addPrescription: (examinationId: string, payload: { notes?: string; items: Record<string, unknown>[] }) =>
    apiClient.post<Prescription>(`/examinations/${examinationId}/prescriptions`, payload).then((r) => r.data),
  addLabTest: (examinationId: string, testName: string) =>
    apiClient
      .post<LabTestOrder>(`/examinations/${examinationId}/lab-tests`, { testName })
      .then((r) => r.data),
  updateLabTest: (labTestId: string, payload: Record<string, unknown>) =>
    apiClient.patch<LabTestOrder>(`/examinations/lab-tests/${labTestId}`, payload).then((r) => r.data),
  /** The PDF route requires auth, so it can't be a plain <a href> - fetch as a blob and open it. */
  downloadPdf: async (examinationId: string) => {
    const response = await apiClient.get(`/examinations/${examinationId}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data as Blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
