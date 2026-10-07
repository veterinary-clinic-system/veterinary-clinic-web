import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_SERVER_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.VITE_API_BASE_URL?.startsWith('http')
    ? new URL(import.meta.env.VITE_API_BASE_URL).origin
    : 'http://localhost:3010');

let socketInstance: Socket | null = null;

export function getRealtimeSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(`${SOCKET_SERVER_URL}/realtime`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}

/**
 * Hook lắng nghe một sự kiện realtime từ Socket.IO
 */
export function useRealtimeEvent<T = unknown>(event: string, handler: (data: T) => void) {
  useEffect(() => {
    const socket = getRealtimeSocket();
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler]);
}

/**
 * Hook tự động đồng bộ realtime cho phân hệ Đặt lịch & Hàng chờ
 * Khi có sự kiện từ bất kỳ client nào, nó tự động invalidate cache để UI cập nhật tức thì.
 */
export function useRealtimeScheduling() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getRealtimeSocket();

    const handleAppointmentChanged = () => {
      void queryClient.invalidateQueries({ queryKey: ['staff-calendar-week'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-calendar-day'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-calendar-month'] });
      void queryClient.invalidateQueries({ queryKey: ['appointments-list'] });
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const handleQueueChanged = () => {
      void queryClient.invalidateQueries({ queryKey: ['queue'] });
      void queryClient.invalidateQueries({ queryKey: ['appointments-list'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-calendar-week'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-calendar-day'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    socket.on('appointment:changed', handleAppointmentChanged);
    socket.on('queue:changed', handleQueueChanged);

    return () => {
      socket.off('appointment:changed', handleAppointmentChanged);
      socket.off('queue:changed', handleQueueChanged);
    };
  }, [queryClient]);
}
