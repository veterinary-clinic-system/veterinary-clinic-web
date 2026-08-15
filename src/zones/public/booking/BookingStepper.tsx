import { STEP_LABELS, Step } from './types';

/**
 * Dải bảy bước ở đầu biểu mẫu.
 *
 * `<ol>` chứ không phải các `<div>` rời: đây là một chuỗi CÓ THỨ TỰ, và trình đọc màn
 * hình cần đọc ra "mục 3 trên 7". Bước đang mở gắn `aria-current="step"`; bước đã qua
 * có thêm dấu ✓ để không chỉ dựa vào màu mà phân biệt.
 */
export function BookingStepper({ current }: { current: Step }) {
  return (
    <ol
      aria-label={`Tiến trình đặt lịch - bước ${current} trên ${STEP_LABELS.length}`}
      className="flex flex-wrap gap-2 text-xs"
    >
      {STEP_LABELS.map((label, index) => {
        const stepNumber = (index + 1) as Step;
        const isActive = stepNumber === current;
        const isDone = stepNumber < current;

        return (
          <li
            key={label}
            aria-current={isActive ? 'step' : undefined}
            className={
              'flex items-center gap-1.5 rounded-full px-3 py-1 ' +
              (isActive
                ? 'bg-primary text-primary-foreground'
                : isDone
                  ? 'bg-primary/10 text-primary'
                  : 'bg-surface-muted text-muted')
            }
          >
            <span className="font-semibold">{isDone ? '✓' : stepNumber}</span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
