import { apiClient } from './client';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (phone: string, password: string) =>
    apiClient.post<TokenPair>('/auth/login', { phone, password }).then((r) => r.data),

  registerPetOwner: (payload: { phone: string; password: string; fullName: string; email?: string }) =>
    apiClient.post<TokenPair>('/auth/register', payload).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<TokenPair>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken }),
};
