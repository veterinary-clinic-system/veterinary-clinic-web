import { apiClient } from './client';
import { PreScreeningResult } from '@/types/models';

export const prescreeningApi = {
  getForAppointment: (appointmentId: string) =>
    apiClient.get<PreScreeningResult>(`/appointments/${appointmentId}/prescreening`).then((r) => r.data),
  rerun: (appointmentId: string) =>
    apiClient.post<PreScreeningResult>(`/appointments/${appointmentId}/prescreening/run`).then((r) => r.data),
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * The response fields are snake_case (`suggest_booking`, `session_id`) because
 * AiChatController passes veterinary-clinic-ai's raw JSON straight through without
 * remapping - see backend `src/prescreening/ai-chat.controller.ts`.
 */
export const aiChatApi = {
  send: (payload: { sessionId?: string; message: string; history?: ChatMessage[] }) =>
    apiClient
      .post<{ reply: string; suggest_booking: boolean; session_id: string }>('/ai-chat', {
        sessionId: payload.sessionId,
        message: payload.message,
        history: payload.history,
      })
      .then((r) => r.data),
};
