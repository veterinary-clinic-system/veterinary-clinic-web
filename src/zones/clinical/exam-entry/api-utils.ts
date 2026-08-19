import { AxiosError } from 'axios';

/** Backend trả `{ message: string | string[] }` - lấy ra để hiện nguyên văn cho người dùng. */
export function extractApiMessage(error: unknown): string | null {
  const data = (error as AxiosError<{ message?: string | string[] }>)?.response?.data;
  if (!data?.message) return null;
  return Array.isArray(data.message) ? data.message.join(', ') : data.message;
}
