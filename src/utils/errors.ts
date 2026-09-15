import axios from 'axios';

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

export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}
