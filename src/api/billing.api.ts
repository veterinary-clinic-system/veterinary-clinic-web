import { apiClient } from './client';
import { tokenStore } from './token-store';
import { Invoice, PaginatedResult, Payment, PaymentMethod, PaymentStatus } from '@/types/models';

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
    apiClient
      .get<Invoice | null>(`/billing/invoices/by-appointment/${appointmentId}`)
      .then((r) => r.data),
  getOne: (id: string) => apiClient.get<Invoice>(`/billing/invoices/${id}`).then((r) => r.data),
  list: (params: { page?: number; limit?: number; branchId?: string; paid?: boolean }) =>
    apiClient.get<PaginatedResult<Invoice>>('/billing/invoices', { params }).then((r) => r.data),
  pay: (id: string, payload: PayInvoicePayload) =>
    apiClient.patch<Invoice>(`/billing/invoices/${id}/pay`, payload).then((r) => r.data),
  payments: (id: string) =>
    apiClient.get<Payment[]>(`/billing/invoices/${id}/payments`).then((r) => r.data),
  downloadReceipt: async (id: string) => {
    const response = await apiClient.get(`/billing/invoices/${id}/receipt.pdf`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data as Blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};

export interface SepayQrTicket {
  paymentId: string;
  invoiceId: string;
  invoiceCode: string;
  amount: number;
  qrImageUrl: string;
  transferContent: string;
  accountNumber: string;
  bankCode: string;
}

export interface SepayReconciliation {
  id: string;
  providerTransactionId: string;
  gateway: string | null;
  bankReference: string | null;
  accountNumber: string | null;
  transactionDate: string | null;
  receivedAt: string;
  transferAmount: number;
  content: string | null;
  status: 'MATCHED' | 'NEEDS_REVIEW' | 'IGNORED';
  reviewReason: string | null;
  invoiceId: string | null;
}

export interface SepayTicketStatus {
  status: PaymentStatus;
  paidAt: string | null;
}

export const sepayApi = {
  createQr: (invoiceId: string, amount?: number) =>
    apiClient
      .post<SepayQrTicket>(`/billing/sepay/invoices/${invoiceId}/qr`, undefined, {
        params: { amount },
      })
      .then((r) => r.data),
  ticket: (paymentId: string) =>
    apiClient.get<SepayTicketStatus>(`/billing/sepay/tickets/${paymentId}`).then((r) => r.data),
  publicTicket: (paymentId: string) =>
    apiClient
      .get<SepayTicketStatus>(`/billing/sepay/public/tickets/${paymentId}`)
      .then((r) => r.data),
  cancelTicket: (paymentId: string) => apiClient.delete(`/billing/sepay/tickets/${paymentId}`),
  pendingReconciliations: () =>
    apiClient.get<SepayReconciliation[]>('/billing/sepay/reconciliation').then((r) => r.data),
  reconcile: (id: string, invoiceCode: string) =>
    apiClient
      .post<SepayReconciliation>(`/billing/sepay/reconciliation/${id}/match`, { invoiceCode })
      .then((r) => r.data),
  subscribeTicket: async (
    paymentId: string,
    onStatus: (status: SepayTicketStatus) => void,
    signal: AbortSignal,
  ): Promise<void> => {
    const token = tokenStore.getAccessToken();
    const baseUrl = String(apiClient.defaults.baseURL ?? '/api/v1').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/billing/sepay/tickets/${paymentId}/events`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal,
    });
    if (!response.ok || !response.body) throw new Error('Không mở được kênh trạng thái thanh toán');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        const data = frame
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim())
          .join('');
        if (!data) continue;
        const parsed = JSON.parse(data) as Partial<SepayTicketStatus>;
        if (parsed.status) onStatus(parsed as SepayTicketStatus);
      }
    }
  },
};
