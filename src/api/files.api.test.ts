import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';
import { filesApi } from './files.api';
import { tokenStore } from './token-store';

describe('filesApi', () => {
  const postSpy = vi.spyOn(apiClient, 'post');

  beforeEach(() => {
    tokenStore.clear();
    postSpy.mockReset();
    postSpy.mockResolvedValue({
      data: { url: '/uploads/symptom-photos/sample.jpg', path: 'symptom-photos/sample.jpg' },
    } as never);
  });

  afterEach(() => {
    tokenStore.clear();
  });

  it('uploadPublic luôn gọi POST /files/upload/public với category hợp lệ', async () => {
    const file = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' });
    tokenStore.setAccessToken('jwt-token');

    const result = await filesApi.uploadPublic('symptom-photos', file);

    expect(result.url).toBe('/uploads/symptom-photos/sample.jpg');
    expect(postSpy).toHaveBeenCalledTimes(1);
    const [endpoint, form, config] = postSpy.mock.calls[0];
    expect(endpoint).toBe('/files/upload/public');
    expect(form).toBeInstanceOf(FormData);
    expect(config).toMatchObject({
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { category: 'symptom-photos' },
    });
  });

  it('upload tự động định tuyến symptom-photos và symptom-videos sang /files/upload/public khi chưa có access token', async () => {
    const photo = new File(['img'], 'a.png', { type: 'image/png' });
    const video = new File(['vid'], 'b.mp4', { type: 'video/mp4' });

    await filesApi.upload('symptom-photos', photo);
    await filesApi.upload('symptom-videos', video);

    expect(postSpy).toHaveBeenNthCalledWith(
      1,
      '/files/upload/public',
      expect.any(FormData),
      expect.objectContaining({ params: { category: 'symptom-photos' } }),
    );
    expect(postSpy).toHaveBeenNthCalledWith(
      2,
      '/files/upload/public',
      expect.any(FormData),
      expect.objectContaining({ params: { category: 'symptom-videos' } }),
    );
  });

  it('upload giữ nguyên POST /files/upload khi đã đăng nhập (có access token)', async () => {
    tokenStore.setAccessToken('valid-jwt');
    const photo = new File(['img'], 'a.png', { type: 'image/png' });

    await filesApi.upload('symptom-photos', photo);

    expect(postSpy).toHaveBeenCalledWith(
      '/files/upload',
      expect.any(FormData),
      expect.objectContaining({ params: { category: 'symptom-photos' } }),
    );
  });

  it('upload không định tuyến category ngoài phạm vi public sang /files/upload/public', async () => {
    const avatar = new File(['img'], 'avatar.png', { type: 'image/png' });

    await filesApi.upload('pet-avatars', avatar);

    expect(postSpy).toHaveBeenCalledWith(
      '/files/upload',
      expect.any(FormData),
      expect.objectContaining({ params: { category: 'pet-avatars' } }),
    );
  });
});
