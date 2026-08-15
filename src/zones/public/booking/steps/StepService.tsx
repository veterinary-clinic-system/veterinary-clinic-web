import { EmptyState, Skeleton } from '@/components/basic';
import { formatCurrency } from '@/utils/format';
import { BookingForm } from '../use-booking-form';

/**
 * Bước 2 - chọn dịch vụ.
 *
 * Đứng TRƯỚC bước chọn bác sĩ vì thời lượng của dịch vụ quyết định khung giờ nào còn
 * đủ chỗ ở bước 4 (xem `slotFitsService`).
 */
export function StepService({ service }: { service: BookingForm['service'] }) {
  return (
    <section aria-labelledby="buoc-dich-vu">
      <h2 id="buoc-dich-vu" className="text-lg font-semibold text-foreground">
        Chọn dịch vụ
      </h2>
      <p className="mt-1 text-sm text-muted">
        Thời lượng của dịch vụ quyết định khung giờ nào còn đặt được ở bước sau.
      </p>

      {service.isLoading && (
        <div
          role="status"
          aria-busy="true"
          aria-label="Đang tải danh sách dịch vụ"
          className="mt-4 space-y-3"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
              <div className="flex-1">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {service.list.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={service.id === item.id}
            onClick={() => service.select(item.id)}
            className={
              'flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors ' +
              (service.id === item.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-surface hover:border-primary/50')
            }
          >
            <div>
              <p className="font-medium text-foreground">{item.item.itemName}</p>
              {item.item.describe && <p className="mt-0.5 text-sm text-muted">{item.item.describe}</p>}
              <p className="mt-0.5 text-xs text-muted">{item.durationMinutes} phút</p>
            </div>
            <p className="whitespace-nowrap font-semibold text-primary">
              {formatCurrency(item.item.unitPrice)}
            </p>
          </button>
        ))}
      </div>

      {!service.isLoading && service.list.length === 0 && (
        <EmptyState
          className="mt-4"
          icon="🩺"
          title="Chưa có dịch vụ nào"
          description="Bảng giá dịch vụ chưa được cấu hình. Vui lòng gọi cho phòng khám để được tư vấn."
        />
      )}
    </section>
  );
}
