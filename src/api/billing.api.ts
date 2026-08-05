import { apiClient } from './client';
import { Invoice, PaginatedResult, Payment, PaymentMethod } from '@/types/models';

/** Một lần trả: bỏ trống `amount` = trả hết phần còn lại (P8-T2). */
export interface PayInvoicePayload {
  paymentMethod: PaymentMethod;
  amount?: number;
  referenceCode?: string;
  note?: string;
}

export const billingApi = {
  generate: (appointmentId: string) =>
    apiClient.post<Invoice>(`/billing/appointments/${appointmentId}/invoice`).then((r) => r.data),
  getByAppointment: (appointmentId: string) =>
    apiClient.get<Invoice | null>(`/billing/invoices/by-appointment/${appointmentId}`).then((r) => r.data),
  getOne: (id: string) => apiClient.get<Invoice>(`/billing/invoices/${id}`).then((r) => r.data),
  list: (params: { page?: number; limit?: number; branchId?: string; paid?: boolean }) =>
    apiClient.get<PaginatedResult<Invoice>>('/billing/invoices', { params }).then((r) => r.data),
  pay: (id: string, payload: PayInvoicePayload) =>
    apiClient.patch<Invoice>(`/billing/invoices/${id}/pay`, payload).then((r) => r.data),
  payments: (id: string) =>
    apiClient.get<Payment[]>(`/billing/invoices/${id}/payments`).then((r) => r.data),
};
