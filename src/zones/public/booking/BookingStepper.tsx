import { Icon, cn } from '@/components/basic';
import { STEP_LABELS, Step } from './types';

export interface BookingStepperProps {
  current: Step;
  /** Cho phép quay lại một bước đã hoàn thành. Bỏ trống thì dải chỉ để đọc. */
  onGoToStep?: (step: Step) => void;
}

/**
 * Dải bảy bước ở đầu biểu mẫu đặt lịch.
 *
 * `<ol>` chứ không phải các `<div>` rời: đây là một chuỗi CÓ THỨ TỰ, và trình đọc màn
 * hình cần đọc ra "mục 3 trên 7". Bước đang mở gắn `aria-current="step"`; bước đã qua
 * có dấu tích để không chỉ dựa vào màu mà phân biệt.
 *
 * Bước đã hoàn thành **bấm được để quay lại**. Đây không phải tiện nghi: khách hay nhớ
 * ra mình chọn nhầm chi nhánh khi đã tới bước nhập thông tin, và không có lối quay lại
 * thì họ phải bấm "Quay lại" bốn lần hoặc tải lại trang và mất sạch dữ liệu đã nhập.
 *
 * Trên màn hình hẹp chỉ hiện số thứ tự; nhãn chữ giữ trong `aria-label` nên trình đọc
 * màn hình không mất gì. Bảy nhãn tiếng Việt ở 375px xuống ba hàng và đẩy biểu mẫu ra
 * khỏi tầm nhìn.
 */
export function BookingStepper({ current, onGoToStep }: BookingStepperProps) {
  return (
    <ol
      aria-label={`Tiến trình đặt lịch - bước ${current} trên ${STEP_LABELS.length}`}
      className="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2"
    >
      {STEP_LABELS.map((label, index) => {
        const stepNumber = (index + 1) as Step;
        const isActive = stepNumber === current;
        const isDone = stepNumber < current;
        const clickable = isDone && Boolean(onGoToStep);

        const content = (
          <>
            <span aria-hidden="true" className="font-semibold tabular-nums">
              {isDone ? <Icon name="check" className="h-3.5 w-3.5" /> : stepNumber}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </>
        );

        const className = cn(
          'flex min-h-touch items-center gap-1.5 rounded-full px-3',
          isActive
            ? 'bg-primary font-medium text-primary-foreground'
            : isDone
              ? 'bg-primary/10 text-primary'
              : 'bg-surface-muted text-muted',
          clickable && 'transition-colors hover:bg-primary/20',
        );

        return (
          <li key={label} aria-current={isActive ? 'step' : undefined}>
            {clickable ? (
              <button
                type="button"
                onClick={() => onGoToStep?.(stepNumber)}
                aria-label={`Quay lại bước ${stepNumber}: ${label}`}
                className={className}
              >
                {content}
              </button>
            ) : (
              <span aria-label={`Bước ${stepNumber}: ${label}`} className={className}>
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
