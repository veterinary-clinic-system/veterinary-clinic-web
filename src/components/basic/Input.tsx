import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { FieldWrapper, cn, describedBy } from './utils';

/*
  `time` có mặt vì phần mềm phòng khám nhập giờ ở nhiều chỗ: ca làm việc, giờ nghỉ, khung
  giờ hẹn. Trước đây những chỗ đó dùng ô chữ với gợi ý "HH:mm", tức là không có bộ chọn,
  không có kiểm tra, và trên điện thoại thì bàn phím hiện ra là bàn phím chữ.
*/
export type InputType = 'text' | 'number' | 'date' | 'time' | 'email' | 'tel' | 'password';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  type?: InputType;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, type = 'text', id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `input-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <FieldWrapper id={inputId} label={label} error={error} hint={hint}>
      <input
        ref={ref}
        id={inputId}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(errorId, hintId)}
        className={cn(
          'h-10 rounded border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-destructive focus:ring-destructive',
          className,
        )}
        {...rest}
      />
    </FieldWrapper>
  );
});
