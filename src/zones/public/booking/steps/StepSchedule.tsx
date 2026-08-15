import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button, ErrorState, Skeleton } from '@/components/basic';
import { slotFitsService } from '../slot-fit';
import { BookingForm } from '../use-booking-form';
import { SlotGrid } from './SlotGrid';

/** Bước 4 - chọn ngày và giờ khám. */
export function StepSchedule({
  schedule,
  service,
}: {
  schedule: BookingForm['schedule'];
  service: BookingForm['service'];
}) {
  const days = schedule.days;

  /* Cả tuần không còn ô nào đủ chỗ cho dịch vụ đã chọn. */
  const weekIsFull =
    !!days &&
    days.some((d) => d.slots.length > 0) &&
    days.every((d) => d.slots.every((s) => !slotFitsService(d.slots, s, service.duration)));

  return (
    <section aria-labelledby="buoc-thoi-gian">
      <h2 id="buoc-thoi-gian" className="text-lg font-semibold text-foreground">
        Chọn ngày và giờ khám
      </h2>
      <p className="mt-1 text-sm text-muted">
        Lịch hẹn sớm nhất là ngày mai ({format(schedule.earliestBookable, 'dd/MM/yyyy')}). Cần khám
        trong hôm nay, vui lòng đến trực tiếp phòng khám.
      </p>
      {service.selected && (
        <p className="mt-1 text-sm text-muted">
          {service.selected.item.itemName} cần {service.duration} phút liên tục - những khung giờ
          không đủ chỗ đã được làm mờ.
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          disabled={!schedule.canGoPrevWeek}
          onClick={() => schedule.goToWeek('prev')}
        >
          ← Tuần trước
        </Button>
        <Button variant="secondary" size="sm" onClick={() => schedule.goToWeek('next')}>
          Tuần sau →
        </Button>
      </div>

      {schedule.isLoading && (
        <div role="status" aria-busy="true" aria-label="Đang tải lịch khám" className="mt-4 space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      )}

      {schedule.isError && (
        <ErrorState
          className="mt-4"
          title="Không tải được lịch khám"
          description="Không lấy được khung giờ trống của tuần này. Vui lòng thử lại hoặc chọn tuần khác."
          onRetry={() => schedule.goToWeek('next')}
          retryLabel="Xem tuần sau"
        />
      )}

      {days && days.length > 0 && (
        <>
          <SlotGrid
            days={days}
            serviceDuration={service.duration}
            selectedSlot={schedule.selectedSlot}
            onSelect={schedule.setSelectedSlot}
          />

          {days.every((d) => d.slots.length === 0) && (
            <p className="mt-3 text-muted">Không có khung giờ nào trong tuần này.</p>
          )}

          {/*
            Tuần đang xem có thể không còn ô nào đặt được - hay gặp nhất là khi đặt vào
            cuối tuần, lúc mọi ngày còn lại đều đã qua hoặc phòng khám đóng cửa. Nói
            thẳng ra và đưa luôn nút sang tuần sau, thay vì để khách nhìn một bảng xám
            và tự đoán.
          */}
          {weekIsFull && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-surface-muted px-4 py-3 text-sm">
              <span className="text-muted">
                Tuần này không còn khung giờ nào đủ {service.duration} phút liên tục cho dịch vụ đã
                chọn.
              </span>
              <Button size="sm" onClick={() => schedule.goToWeek('next')}>
                Xem tuần sau →
              </Button>
            </div>
          )}
        </>
      )}

      <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded bg-primary/20" /> Còn trống
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded border border-border bg-surface-muted"
          />{' '}
          Không khả dụng
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded border border-dashed border-border"
          />{' '}
          Đã qua
        </li>
      </ul>

      {/* `aria-live` để trình đọc màn hình báo lại lựa chọn ngay khi khách bấm một ô. */}
      <p aria-live="polite" className="mt-4">
        {schedule.selectedSlot && (
          <span className="inline-block rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            Đã chọn:{' '}
            {format(parseISO(schedule.selectedSlot.startAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })}
          </span>
        )}
      </p>
    </section>
  );
}
