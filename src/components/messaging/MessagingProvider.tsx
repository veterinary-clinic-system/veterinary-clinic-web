import { ReactNode, useEffect, useState } from 'react';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { ChatMessage, messagingKeys } from '@/api/messaging.api';
import { connectMessagingSocket, disconnectMessagingSocket } from '@/api/messaging-socket';
import { useToast } from '@/components/basic';
import { CallProvider } from '@/components/calls/CallProvider';
import { useAuth } from '@/context/AuthContext';
import { MESSAGING_ROLES, appendMessageToCache } from './messaging-shared';

function MessagingRealtimeBridge({ socket, userId }: { socket: Socket; userId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const location = useLocation();
  const onMessagesPage = /\/messages(\/|$)/.test(location.pathname);

  useEffect(() => {
    const onMessage = (message: ChatMessage) => {
      queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
        messagingKeys.messages(message.conversationId),
        (data) => appendMessageToCache(data, message),
      );
      void queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
      void queryClient.invalidateQueries({ queryKey: messagingKeys.unread() });
      if (message.senderUserId !== userId && message.kind !== 'CALL' && !onMessagesPage) {
        toast.show('Bạn có tin nhắn mới', 'info');
      }
    };
    const onRead = () => {
      void queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
      void queryClient.invalidateQueries({ queryKey: messagingKeys.unread() });
    };
    // Nối lại sau khi rớt mạng: có thể đã lỡ tin, tải lại những gì đang hiện.
    const onReconnect = () => {
      void queryClient.invalidateQueries({ queryKey: messagingKeys.all });
    };

    socket.on('message:new', onMessage);
    socket.on('conversation:read', onRead);
    socket.io.on('reconnect', onReconnect);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('conversation:read', onRead);
      socket.io.off('reconnect', onReconnect);
    };
  }, [socket, queryClient, toast, userId, onMessagesPage]);

  return null;
}

/**
 * Bật kênh realtime nhắn tin + gọi điện cho chủ nuôi và bác sĩ đã đăng nhập (ở mọi trang,
 * để cuộc gọi đến hiện ra dù đang ở đâu). Vai trò khác không mở kết nối nào.
 */
export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const enabled = Boolean(user && MESSAGING_ROLES.includes(user.role));
  const userId = user?.sub ?? null;
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !userId) {
      setSocket(null);
      return undefined;
    }
    setSocket(connectMessagingSocket());
    return () => {
      disconnectMessagingSocket();
      setSocket(null);
    };
  }, [enabled, userId]);

  // Luôn bọc CallProvider (kể cả khi chưa có kết nối) để cây con không bị dựng lại lúc đăng nhập.
  return (
    <CallProvider socket={socket}>
      {socket && userId && <MessagingRealtimeBridge socket={socket} userId={userId} />}
      {children}
    </CallProvider>
  );
}
