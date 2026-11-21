/**
 * Địa chỉ backend đọc từ biến môi trường lúc build (Cloudflare Pages). Biến dán vào dashboard
 * từng dính ký tự Tab đầu chuỗi ("\thttps://...") nên socket nối tới một host không tồn tại -
 * luôn `trim()` và chỉ nhận URL http(s) hợp lệ.
 */
function cleanUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/\/+$/, '');
  return trimmed ? trimmed : undefined;
}

function isHttpUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const API_BASE_URL = cleanUrl(import.meta.env.VITE_API_BASE_URL) ?? '/api/v1';

/**
 * Máy chủ Socket.IO (/realtime, /messaging). API tuyệt đối thì socket LUÔN ở origin của API:
 * CloudFront phục vụ `/socket.io` cùng domain với `/api/v1`. `VITE_WS_URL` cũ trên dashboard
 * Pages từng trỏ vào quick tunnel trycloudflare đã chết - không để nó thắng URL API đang chạy.
 * `VITE_WS_URL` chỉ còn dùng khi API là đường dẫn tương đối (dev qua proxy).
 */
export function resolveSocketServerUrl(
  wsUrl: string | undefined = import.meta.env.VITE_WS_URL,
  apiBaseUrl: string = API_BASE_URL,
): string {
  if (isHttpUrl(apiBaseUrl)) return new URL(apiBaseUrl).origin;
  const explicit = cleanUrl(wsUrl);
  if (isHttpUrl(explicit)) return explicit;
  // API tương đối ("/api/v1" qua proxy): socket cùng origin với trang.
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3010';
}

export const SOCKET_SERVER_URL = resolveSocketServerUrl();
