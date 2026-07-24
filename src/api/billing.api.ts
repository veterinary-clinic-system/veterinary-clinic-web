import { apiClient } from './client';
import { Invoice, PaginatedResult, PaymentMethod } from '@/types/models';

export const billingApi = {
  generate: (appointmentId: string) =>
    apiClient.post<Invoice>(`/billing/appointments/${appointmentId}/invoice`).then((r) => r.data),
  getByAppointment: (appointmentId: string) =>
    apiClient.get<Invoice | null>(`/billing/invoices/by-appointment/${appointmentId}`).then((r) => r.data),
  getOne: (id: string) => apiClient.get<Invoice>(`/billing/invoices/${id}`).then((r) => r.data),
  list: (params: { page?: number; limit?: number; branchId?: string; paid?: boolean }) =>
    apiClient.get<PaginatedResult<Invoice>>('/billing/invoices', { params }).then((r) => r.data),
  pay: (id: string, paymentMethod: PaymentMethod) =>
    apiClient.patch<Invoice>(`/billing/invoices/${id}/pay`, { paymentMethod }).then((r) => r.data),
};
