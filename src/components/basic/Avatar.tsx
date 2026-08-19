import { cn } from './utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

/**
 * Lấy chữ cái đầu để làm ảnh đại diện dự phòng.
 *
 * Tên tiếng Việt viết theo thứ tự họ trước, nên chữ cái có ý nghĩa nhận dạng nhất là
 * chữ đầu của TỪ CUỐI ("Nguyễn Minh Anh" -> "A", không phải "N"). Lấy chữ đầu của họ
 * thì cả phòng khám đầy chữ "N".
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts[parts.length - 1][0].toUpperCase();
}

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  /** Viền sáng quanh ảnh - dùng khi avatar nằm trên nền ảnh hoặc nền màu. */
  ring?: boolean;
  className?: string;
}

/**
 * Ảnh đại diện của người hoặc thú cưng.
 *
 * Không có ảnh thì hiện chữ cái đầu trên nền nhạt, KHÔNG hiện icon người chung chung:
 * trong một danh sách 20 hàng, 20 icon giống hệt nhau không giúp phân biệt được ai với
 * ai, còn chữ cái thì có.
 *
 * `alt=""` vì tên luôn được viết ngay cạnh trong mọi chỗ dùng - đọc lại tên lần hai là
 * tiếng ồn cho người dùng trình đọc màn hình.
 */
export function Avatar({ name, src, size = 'md', ring = false, className }: AvatarProps) {
  const base = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
    SIZE_CLASSES[size],
    ring && 'ring-2 ring-surface',
    className,
  );

  if (src) {
    return <img src={src} alt="" className={cn(base, 'bg-surface-muted object-cover')} />;
  }

  return (
    <span aria-hidden="true" className={cn(base, 'bg-primary/10 text-primary')}>
      {initialsOf(name)}
    </span>
  );
}
