import { useNavigate } from 'react-router-dom';
import { Button, Icon } from '@/components/basic';
import { Service } from '@/types/models';
import { formatCurrency } from '@/utils/format';

/**
 * Thẻ dịch vụ - dùng chung ở trang chủ và trang bảng giá.
 *
 * Ba thông tin khách cần trước khi bấm đặt lịch: **làm gì, bao nhiêu tiền, mất bao
 * lâu**. Giá và thời lượng nằm ở hàng dưới cùng, cùng một vị trí trên mọi thẻ, để mắt
 * so sánh được theo cột khi lướt qua chín thẻ.
 *
 * Nút đặt lịch mang theo `serviceId` trong `location.state`, nên khách vào biểu mẫu là
 * đã qua bước 1 (xem `BookingHandoffState`). Đây là chỗ giảm ma sát rẻ nhất của cả
 * luồng - không có nó, khách phải tự nhớ tên dịch vụ vừa xem rồi tìm lại trong danh
 * sách thả xuống.
 */
export function ServiceCard({ service }: { service: Service }) {
  const navigate = useNavigate();

  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/40">
      <div className="flex-1">
        <h3 className="text-base font-semibold text-foreground">{service.item.itemName}</h3>
        {service.item.describe && (
          <p className="mt-1.5 line-clamp-3 text-sm text-muted">{service.item.describe}</p>
        )}
      </div>

      <dl className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
        <div>
          <dt className="text-xs text-muted">Giá tham khảo</dt>
          <dd className="text-lg font-semibold tabular-nums text-foreground">
            {formatCurrency(service.item.unitPrice)}
          </dd>
        </div>
        <div className="text-right">
          <dt className="sr-only">Thời lượng</dt>
          <dd className="inline-flex items-center gap-1 text-sm text-muted">
            <Icon name="clock" className="h-4 w-4" />
            {service.durationMinutes} phút
          </dd>
        </div>
      </dl>

      <Button
        className="mt-4"
        fullWidth
        onClick={() => navigate('/booking', { state: { serviceId: service.id } })}
      >
        Đặt lịch dịch vụ này
      </Button>
    </article>
  );
}
