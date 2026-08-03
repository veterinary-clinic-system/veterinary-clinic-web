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
