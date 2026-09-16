const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || 'cloudinary-not-configured';
const rootFolder = (import.meta.env.VITE_CLOUDINARY_FOLDER ?? 'vetcare').replace(/^\/+|\/+$/g, '');

export function cloudinaryImage(relativePath: string): string {
  const path = relativePath.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${rootFolder}/web/${path}`;
}

export const DEFAULT_USER_IMAGE = cloudinaryImage('images/default-user.svg');
export const DEFAULT_STAFF_IMAGE = cloudinaryImage('images/default-staff.svg');
export const DEFAULT_ITEM_IMAGE = cloudinaryImage('images/default-item.svg');
