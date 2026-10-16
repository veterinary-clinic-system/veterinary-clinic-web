import { apiClient } from './client';

export type MessageKind = 'TEXT' | 'IMAGE' | 'CALL';
export type CallMedia = 'AUDIO' | 'VIDEO';
export type CallStatus = 'RINGING' | 'ACCEPTED' | 'REJECTED' | 'MISSED' | 'CANCELLED' | 'ENDED';

export interface Counterpart {
  /** doctorId nếu đối phương là bác sĩ, userId nếu là chủ nuôi - dùng để mở cuộc trò chuyện. */
  id: string;
  userId: string;
  role: 'DOCTOR' | 'PET_OWNER';
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
}

export interface Conversation {
  id: string;
  counterpart: Counterpart;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  counterpartLastReadAt: string | null;
  createdAt: string;
}

export interface MessagingContact {
  counterpart: Counterpart;
  petNames: string[];
  lastVisitAt: string | null;
  conversationId: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  kind: MessageKind;
  body: string | null;
  imageUrl: string | null;
  createdAt: string;
  call: {
    id: string;
    media: CallMedia;
    status: CallStatus;
    callerUserId: string;
    answeredAt: string | null;
    endedAt: string | null;
    endReason: string | null;
  } | null;
}

export interface RtcConfig {
  iceServers: RTCIceServer[];
}

export const MESSAGING_PAGE_SIZE = 30;

export const messagingKeys = {
  all: ['messaging'] as const,
  conversations: () => ['messaging', 'conversations'] as const,
  contacts: () => ['messaging', 'contacts'] as const,
  unread: () => ['messaging', 'unread'] as const,
  messages: (conversationId: string) => ['messaging', 'messages', conversationId] as const,
};

export const messagingApi = {
  contacts: async (): Promise<MessagingContact[]> =>
    (await apiClient.get('/messaging/contacts')).data,

  conversations: async (): Promise<Conversation[]> =>
    (await apiClient.get('/messaging/conversations')).data,

  open: async (target: { doctorId?: string; ownerId?: string }): Promise<Conversation> =>
    (await apiClient.post('/messaging/conversations', target)).data,

  messages: async (
    conversationId: string,
    params: { before?: string; limit?: number } = {},
  ): Promise<ChatMessage[]> =>
    (await apiClient.get(`/messaging/conversations/${conversationId}/messages`, { params })).data,

  send: async (
    conversationId: string,
    payload: { body?: string; imageUrl?: string },
  ): Promise<ChatMessage> =>
    (await apiClient.post(`/messaging/conversations/${conversationId}/messages`, payload)).data,

  markRead: async (conversationId: string): Promise<{ readAt: string }> =>
    (await apiClient.post(`/messaging/conversations/${conversationId}/read`)).data,

  unreadCount: async (): Promise<{ unreadCount: number }> =>
    (await apiClient.get('/messaging/unread-count')).data,

  rtcConfig: async (): Promise<RtcConfig> => (await apiClient.get('/messaging/rtc-config')).data,
};
