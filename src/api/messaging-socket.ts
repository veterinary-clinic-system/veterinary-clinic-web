import { io, Socket } from 'socket.io-client';
import { refreshAccessToken } from './client';
import { tokenStore } from './token-store';
import { SOCKET_SERVER_URL } from './socket';

/**
 * Kết nối Socket.IO tới namespace /messaging. Khác /realtime (công khai), kênh này xác thực
 * bằng access token lúc bắt tay - `auth` là hàm nên mỗi lần nối lại đều lấy token mới nhất.
 * Token hết hạn (15 phút) thì làm mới một lần rồi nối lại.
 */
let socket: Socket | null = null;

export function getMessagingSocket(): Socket {
  if (socket) return socket;

  const created = io(`${SOCKET_SERVER_URL}/messaging`, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    auth: (cb) => cb({ token: tokenStore.getAccessToken() }),
  });

  let refreshing = false;
  created.on('connect_error', (error) => {
    // Middleware từ chối thì socket.io không tự thử lại - làm mới token rồi nối lại một lần.
    if (error.message === 'TOKEN_EXPIRED' && !refreshing && tokenStore.getRefreshToken()) {
      refreshing = true;
      refreshAccessToken()
        .then(() => created.connect())
        .catch(() => undefined)
        .finally(() => {
          refreshing = false;
        });
    }
  });

  socket = created;
  return created;
}

export function connectMessagingSocket(): Socket {
  const s = getMessagingSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectMessagingSocket() {
  socket?.disconnect();
  socket = null;
}

export interface SocketAck {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

/** Gửi một sự kiện và chờ ack của máy chủ (có hạn chờ để giao diện không treo khi mất mạng). */
export function emitWithAck<T extends SocketAck = SocketAck>(
  event: string,
  payload: unknown,
  timeoutMs = 8000,
): Promise<T> {
  const s = getMessagingSocket();
  return new Promise((resolve) => {
    s.timeout(timeoutMs).emit(event, payload, (err: Error | null, response: T) => {
      if (err) resolve({ ok: false, error: 'Không kết nối được máy chủ' } as T);
      else resolve(response);
    });
  });
}
