import { apiClient } from './client';

/** Hồ sơ của chủ nuôi đang đăng nhập (`GET /users/me`). */
export interface OwnerProfile {
  id: string;
  phone: string;
  fullName: string;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  avatarUrl: string;
  customerCode: string | null;
}

export interface UpdateOwnerProfilePayload {
  fullName?: string;
  /** Chuỗi rỗng = bỏ email. */
  email?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  avatarUrl?: string;
}

export const accountApi = {
  me: () => apiClient.get<OwnerProfile>('/users/me').then((r) => r.data),

  updateProfile: (payload: UpdateOwnerProfilePayload) =>
    apiClient.patch<OwnerProfile>('/users/me', payload).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch('/users/me/password', { currentPassword, newPassword }),

  /** Ẩn danh hoá tài khoản; hồ sơ khám của các bé vẫn được phòng khám lưu giữ. */
  deleteAccount: (password: string) => apiClient.post('/users/me/delete', { password }),
};
