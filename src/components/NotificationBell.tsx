import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StaffNotification, staffNotificationsApi } from '@/api/staff-notifications.api';
import { Badge, Button, Skeleton } from '@/components/basic';
import { formatDateTime } from '@/utils/format';

/** Nhịp hỏi lại số chưa đọc. 60s: đủ nhanh để không lỡ việc, đủ chậm để không tốn. */
const POLL_MS = 60_000;

const TYPE_TONE: Record<string, 'warning' | 'destructive' | 'default'> = {
  OUT_OF_STOCK: 'destructive',
  EXPIRED: 'destructive',
  PAYMENT_FAILED: 'destructive',
  LOW_STOCK: 'warning',
  EXPIRING_SOON: 'warning',
  APPOINTMENT_CANCELLED: 'warning',
  VACCINATION_DUE: 'default',
};

const TYPE_LABEL_VI: Record<string, string> = {
  LOW_STOCK: 'Sắp hết hàng',
  OUT_OF_STOCK: 'Hết hàng',
  EXPIRING_SOON: 'Sắp hết hạn',
  EXPIRED: 'Đã hết hạn',
  PAYMENT_FAILED: 'Thanh toán lỗi',
  APPOINTMENT_CANCELLED: 'Lịch hẹn hủy',
  VACCINATION_DUE: 'Đến hạn tiêm',
};

/**
 * Chuông thông báo trong ứng dụng — SRS FR-23 mục 18 (P10-T5).
 *
 * HỎI LẠI ĐỊNH KỲ chứ không dùng WebSocket. Với một hệ có vài chục nhân viên và những
 * sự kiện tính bằng phút (tồn thấp, thuốc sắp hết hạn), một truy vấn `COUNT` trên khoá
 * đã đánh chỉ mục mỗi phút rẻ hơn nhiều so với việc dựng và trông một kênh realtime —
 * cùng với tất cả những gì đi kèm nó: xác thực lại khi token xoay, kết nối lại khi
 * mạng chập, và một trạng thái thứ hai phải đồng bộ.
 *
 * Danh sách chỉ tải KHI MỞ, không tải cùng số đếm: phần lớn thời gian không ai mở nó ra.
 */
export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const countQuery = useQuery({
    queryKey: ['staff-notifications-unread'],
    queryFn: () => staffNotificationsApi.unreadCount(),
    refetchInterval: POLL_MS,
  });

  const listQuery = useQuery({
    queryKey: ['staff-notifications'],
    queryFn: () => staffNotificationsApi.list({ limit: 15 }),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => staffNotificationsApi.markRead(id),
    onSuccess: () => void invalidate(),
  });

  const markAllMutation = useMutation({
    mutationFn: () => staffNotificationsApi.markAllRead(),
    onSuccess: () => void invalidate(),
  });

  function invalidate() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['staff-notifications-unread'] }),
    ]);
  }

  // Bấm ra ngoài thì đóng — hộp này che nội dung phía dưới nó.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const unread = countQuery.data?.unread ?? 0;

  /**
   * Bấm vào một thông báo: đánh dấu đã đọc RỒI mới điều hướng.
   *
   * Không chờ mutation xong mới đi — nếu mạng chậm thì người dùng sẽ bấm lần nữa vì
   * tưởng hụt. Đánh dấu đã đọc là việc phụ, đi tới nơi cần đến mới là việc chính.
   */
  function openNotification(notification: StaffNotification) {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded p-2 hover:bg-surface-muted"
        aria-label={unread > 0 ? `Thông báo (${unread} chưa đọc)` : 'Thông báo'}
        aria-expanded={open}
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-destructive px-1 text-center text-[11px] font-medium leading-[18px] text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="font-medium">Thông báo</span>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                loading={markAllMutation.isPending}
                onClick={() => markAllMutation.mutate()}
              >
                Đánh dấu đã đọc hết
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {listQuery.isLoading && (
              <div className="flex flex-col gap-2 px-4 py-4" aria-busy="true">
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} className="h-10 w-full" />
                ))}
              </div>
            )}
            {/*
              "Không có thông báo nào" khi thật ra chuông không gọi được API là cách
              nhanh nhất để một cảnh báo hết hạn thuốc trôi qua mà không ai biết.
            */}
            {listQuery.isError && (
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                <p className="text-sm text-muted">Không tải được thông báo.</p>
                <Button variant="secondary" size="sm" onClick={() => void listQuery.refetch()}>
                  Thử lại
                </Button>
              </div>
            )}
            {!listQuery.isLoading && !listQuery.isError && (listQuery.data?.data.length ?? 0) === 0 && (
              <p className="px-4 py-6 text-center text-muted">Không có thông báo nào.</p>
            )}
            <ul className="divide-y divide-border">
              {(listQuery.data?.data ?? []).map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`w-full px-4 py-3 text-left hover:bg-surface-muted ${
                      notification.readAt ? '' : 'bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={TYPE_TONE[notification.type] ?? 'default'}>
                        {TYPE_LABEL_VI[notification.type] ?? notification.type}
                      </Badge>
                      {!notification.readAt && (
                        <span className="h-2 w-2 rounded-full bg-primary" aria-label="Chưa đọc" />
                      )}
                    </div>
                    <p className="mt-1 font-medium">{notification.title}</p>
                    <p className="text-sm text-muted">{notification.body}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/** Vẽ tay thay vì kéo một bộ icon: cả hệ chỉ cần đúng một hình này. */
function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
