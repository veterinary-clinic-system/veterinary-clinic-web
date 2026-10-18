import { apiClient } from './client';
import { PreScreeningResult } from '@/types/models';
import { PriorityColor } from '@/types/enums';

export const prescreeningApi = {
  getForAppointment: (appointmentId: string) =>
    apiClient.get<PreScreeningResult>(`/appointments/${appointmentId}/prescreening`).then((r) => r.data),
  rerun: (appointmentId: string) =>
    apiClient.post<PreScreeningResult>(`/appointments/${appointmentId}/prescreening/run`).then((r) => r.data),
};

/**
 * Trạng thái hội thoại đặt lịch của trợ lý. Máy chủ không lưu phiên: trang chat giữ
 * nguyên object nhận được và gửi lại ở lượt sau - không đọc hay sửa bên trong.
 */
export type AiChatDraft = Record<string, unknown>;

export interface AiChatBooking {
  id: string;
  code: string;
  petName: string;
  branchName: string;
  branchAddress: string;
  serviceName: string;
  startAt: string;
  status: string;
}

export interface AiChatDelivery {
  channel: 'ZALO' | 'EMAIL' | 'SMS' | 'PUSH';
  recipient: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error: string | null;
}

export interface AiChatResponse {
  sessionId: string;
  reply: string;
  intent: 'GREETING' | 'THANKS' | 'TRIAGE' | 'BOOKING' | 'SCHEDULE_LOOKUP' | 'VACCINE_INFO' | 'RESET' | 'HELP';
  draft: AiChatDraft;
  missingFields: string[];
  quickReplies: string[];
  suggestBooking: boolean;
  requiresLogin: boolean;
  triage?: {
    priorityColor: PriorityColor;
    reasoning: string | null;
    suspectedDiseases: Array<{ name: string; confidence: number }>;
    analyzedImages: number;
    analyzedVideos: number;
  };
  booking?: AiChatBooking;
  notifications?: { simulated: boolean; deliveries: AiChatDelivery[] } | null;
}

export const aiChatApi = {
  send: (payload: {
    sessionId?: string;
    message: string;
    images?: string[];
    videos?: string[];
    draft?: AiChatDraft;
  }) => apiClient.post<AiChatResponse>('/ai-chat', payload).then((r) => r.data),
};
