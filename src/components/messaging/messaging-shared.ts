import { InfiniteData, useQuery } from '@tanstack/react-query';
import { ChatMessage, messagingApi, messagingKeys } from '@/api/messaging.api';
import { useAuth } from '@/context/AuthContext';
import { AppointmentStatus, Role } from '@/types/enums';

export const MESSAGING_ROLES: Role[] = [Role.PET_OWNER, Role.DOCTOR];

/** Khớp MESSAGING_ELIGIBLE_APPOINTMENT_STATUSES ở backend - máy chủ vẫn là nơi quyết định. */
export const MESSAGEABLE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
];

/** Chèn một tin vào trang mới nhất của luồng tin nhắn đang có trong cache (bỏ trùng theo id). */
export function appendMessageToCache(
  data: InfiniteData<ChatMessage[]> | undefined,
  message: ChatMessage,
): InfiniteData<ChatMessage[]> | undefined {
  if (!data) return data;
  if (data.pages.some((page) => page.some((m) => m.id === message.id))) return data;
  const [latest = [], ...older] = data.pages;
  return { ...data, pages: [[...latest, message], ...older] };
}

export function useUnreadMessages(): number {
  const { user } = useAuth();
  const enabled = Boolean(user && MESSAGING_ROLES.includes(user.role));
  const { data } = useQuery({
    queryKey: messagingKeys.unread(),
    queryFn: messagingApi.unreadCount,
    enabled,
    // Realtime đã làm mới khi có tin; đây chỉ là lưới an toàn khi socket rớt.
    refetchInterval: 60_000,
  });
  return enabled ? (data?.unreadCount ?? 0) : 0;
}
