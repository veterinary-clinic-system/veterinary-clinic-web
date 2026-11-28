import { apiClient } from './client';
import { tokenStore } from './token-store';

export type FileCategory =
  | 'pet-avatars'
  | 'doctor-avatars'
  | 'user-avatars'
  | 'employee-avatars'
  | 'catalog-images'
  | 'symptom-photos'
  | 'symptom-videos'
  | 'exam-attachments'
  | 'lab-results'
  | 'chat-images';

export type PublicFileCategory = 'symptom-photos' | 'symptom-videos';

const PUBLIC_FILE_CATEGORIES: ReadonlySet<FileCategory> = new Set<PublicFileCategory>([
  'symptom-photos',
  'symptom-videos',
]);

export function isPublicFileCategory(category: FileCategory): category is PublicFileCategory {
  return PUBLIC_FILE_CATEGORIES.has(category);
}

async function postUpload(
  endpoint: '/files/upload' | '/files/upload/public',
  category: FileCategory,
  file: File,
): Promise<{ url: string; path: string }> {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { category },
  });
  return response.data;
}

export const filesApi = {
  uploadPublic: async (
    category: PublicFileCategory,
    file: File,
  ): Promise<{ url: string; path: string }> => postUpload('/files/upload/public', category, file),

  upload: async (category: FileCategory, file: File): Promise<{ url: string; path: string }> => {
    const hasAccessToken = Boolean(tokenStore.getAccessToken());
    if (!hasAccessToken && isPublicFileCategory(category)) {
      return filesApi.uploadPublic(category, file);
    }
    return postUpload('/files/upload', category, file);
  },
};
