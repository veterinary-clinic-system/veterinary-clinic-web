import { AxiosError } from 'axios';

export function extractApiMessage(error: unknown): string | null {
  const data = (error as AxiosError<{ message?: string | string[] }>)?.response?.data;
  if (!data?.message) return null;
  return Array.isArray(data.message) ? data.message.join(', ') : data.message;
}
