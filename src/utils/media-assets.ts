const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || 'cloudinary-not-configured';
const rootFolder = (import.meta.env.VITE_CLOUDINARY_FOLDER ?? 'vetcare').replace(/^\/+|\/+$/g, '');

/**
 * Gốc URL ảnh trên S3 (qua CloudFront). Đặt VITE_MEDIA_BASE_URL, hoặc để trống khi API chạy sau
 * CloudFront: ảnh nằm cùng tên miền ở /media/*. Không có thì dùng Cloudinary như trước.
 */
function mediaBaseUrl(): string | undefined {
  const explicit = import.meta.env.VITE_MEDIA_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const api = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!api?.startsWith('https://')) return undefined;
  try {
    const url = new URL(api);
    return url.hostname.endsWith('.cloudfront.net') ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

const mediaBase = mediaBaseUrl();

/** Ảnh tĩnh dùng chung, khoá `media/web/<path>` trên S3 (scripts/migrate-cloudinary-to-s3.mjs). */
export function mediaImage(relativePath: string): string {
  const path = relativePath.replace(/^\/+/, '');
  if (mediaBase) return `${mediaBase}/media/web/${path}`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${rootFolder}/web/${path}`;
}

export const DEFAULT_USER_IMAGE = mediaImage('images/default-user.svg');
export const DEFAULT_STAFF_IMAGE = mediaImage('images/default-staff.svg');
export const DEFAULT_ITEM_IMAGE = mediaImage('images/default-item.svg');
