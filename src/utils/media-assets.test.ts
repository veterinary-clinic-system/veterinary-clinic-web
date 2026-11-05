import { afterEach, describe, expect, it, vi } from 'vitest';

async function load() {
  vi.resetModules();
  return import('./media-assets');
}

describe('mediaImage', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses S3 under the CloudFront API domain', async () => {
    vi.stubEnv('VITE_MEDIA_BASE_URL', '');
    vi.stubEnv('VITE_API_BASE_URL', 'https://d123.cloudfront.net/api/v1');
    const { mediaImage, DEFAULT_USER_IMAGE } = await load();
    expect(mediaImage('/images/a.webp')).toBe('https://d123.cloudfront.net/media/web/images/a.webp');
    expect(DEFAULT_USER_IMAGE).toBe('https://d123.cloudfront.net/media/web/images/default-user.svg');
  });

  it('prefers an explicit VITE_MEDIA_BASE_URL', async () => {
    vi.stubEnv('VITE_MEDIA_BASE_URL', 'https://cdn.example.net/');
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3010/api/v1');
    const { mediaImage } = await load();
    expect(mediaImage('images/a.webp')).toBe('https://cdn.example.net/media/web/images/a.webp');
  });

  it('falls back to Cloudinary for a local API', async () => {
    vi.stubEnv('VITE_MEDIA_BASE_URL', '');
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3010/api/v1');
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'demo');
    const { mediaImage } = await load();
    expect(mediaImage('images/a.webp')).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/vetcare/web/images/a.webp',
    );
  });
});
