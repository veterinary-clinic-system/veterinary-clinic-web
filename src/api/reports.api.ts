import { apiClient } from './client';

export interface RevenuePoint {
  period: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface AiAccuracyReport {
  totalEvaluated: number;
  accepted: number;
  overridden: number;
  acceptanceRate: number;
  breakdownByColor: { aiPriorityColor: string; acceptedCount: number; overriddenCount: number }[];
}

export const reportsApi = {
  revenue: (params: { from: string; to: string; groupBy?: 'day' | 'month'; branchId?: string }) =>
    apiClient.get<RevenuePoint[]>('/reports/revenue', { params }).then((r) => r.data),
  revenueByService: (params: { from: string; to: string; branchId?: string }) =>
    apiClient
      .get<{ serviceName: string; totalRevenue: number; count: number }[]>('/reports/revenue/by-service', {
        params,
      })
      .then((r) => r.data),
  revenueByDoctor: (params: { from: string; to: string; branchId?: string }) =>
    apiClient
      .get<{ doctorId: string; doctorName: string; totalRevenue: number; appointmentCount: number }[]>(
        '/reports/revenue/by-doctor',
        { params },
      )
      .then((r) => r.data),
  examVolumeByDiseaseGroup: (params: { from?: string; to?: string; branchId?: string }) =>
    apiClient
      .get<{ diseaseGroup: string; count: number }[]>('/reports/exam-volume-by-disease-group', { params })
      .then((r) => r.data),
  aiAccuracy: (params: { from?: string; to?: string; branchId?: string }) =>
    apiClient.get<AiAccuracyReport>('/reports/ai-accuracy', { params }).then((r) => r.data),
};
