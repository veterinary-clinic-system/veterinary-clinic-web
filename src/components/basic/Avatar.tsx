import { cn } from './utils';
import { Icon } from './Icon';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts[parts.length - 1][0].toUpperCase();
}

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  
  ring?: boolean;
  className?: string;
}

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

  const initials = initialsOf(name);
  return (
    <span aria-hidden="true" className={cn(base, 'bg-primary/10 text-primary')}>
      {/* Tài khoản chưa có họ tên thì "tên" là số điện thoại - chữ "0" không phải chữ cái đầu. */}
      {/\p{L}/u.test(initials) ? initials : <Icon name="user" className="h-1/2 w-1/2" />}
    </span>
  );
}
