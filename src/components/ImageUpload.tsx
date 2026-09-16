import { ChangeEvent, useRef, useState } from 'react';
import { FileCategory, filesApi } from '@/api/files.api';
import { getErrorMessage } from '@/utils/errors';
import { DEFAULT_ITEM_IMAGE } from '@/utils/cloudinary-assets';

interface ImageUploadProps {
  label: string;
  category: FileCategory;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}

export function ImageUpload({ label, category, value, onChange, required }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await filesApi.upload(category, file);
      onChange(uploaded.url);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <img
        src={value || DEFAULT_ITEM_IMAGE}
        alt={label}
        className="h-20 w-20 rounded-lg border border-border bg-surface-muted object-cover"
      />
      <div className="flex flex-col items-start gap-1">
        <span className="text-sm font-medium text-foreground">{label}{required ? ' *' : ''}</span>
        <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void selectImage(event)} />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded border border-border px-3 py-2 text-sm hover:bg-surface-muted disabled:opacity-50"
        >
          {uploading ? 'Đang tải ảnh…' : value ? 'Chọn ảnh khác' : 'Chọn ảnh'}
        </button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  );
}
