import { cn } from '@/components/basic';
import { useUnreadMessages } from './messaging-shared';

/** Số tin chưa đọc cạnh mục "Tin nhắn". Có chữ cho trình đọc màn hình, không chỉ là chấm màu. */
export function UnreadMessagesBadge({ className }: { className?: string }) {
  const count = useUnreadMessages();
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
      <span className="sr-only"> tin nhắn chưa đọc</span>
    </span>
  );
}
