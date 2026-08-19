import axios from 'axios';

/** Extracts the backend's Nest-style `{ message: string | string[] }` error body, if present. */
export function getErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi, vui lòng thử lại.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
  }
  return fallback;
}

export function isConflictError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}

/**
 * HTTP 403 - backend đã nhận ra người dùng nhưng ma trận `role_permissions` không cấp
 * quyền cho thao tác đó.
 *
 * Tách riêng khỏi lỗi tải dữ liệu thông thường vì hai thứ cần hai màn hình khác nhau:
 * lỗi mạng thì mời người dùng bấm "Thử lại", còn 403 thì bấm bao nhiêu lần cũng vẫn
 * 403. Đưa nút Thử lại vào một lỗi phân quyền là mời người ta làm một việc vô ích.
 */
export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}
