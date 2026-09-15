import { apiClient } from './client';

export type FileCategory =
  | 'pet-avatars'
  | 'doctor-avatars'
  | 'user-avatars'
  | 'employee-avatars'
  | 'catalog-images'
  | 'symptom-photos'
  | 'exam-attachments'
  | 'lab-results';

export const filesApi = {
  upload: async (category: FileCategory, file: File): Promise<{ url: string; path: string }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { category },
    });
    return response.data;
  },
};
