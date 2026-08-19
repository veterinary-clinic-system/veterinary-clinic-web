import { ReactNode } from 'react';
import { cn } from './utils';

export interface DescriptionItem {
  label: string;
  value: ReactNode;
  /** Chiếm cả hàng - dùng cho ghi chú dài, địa chỉ, danh sách dị ứng. */
  wide?: boolean;
}

/**
 * Bảng nhãn - giá trị.
 *
 * Dùng `<dl>/<dt>/<dd>` chứ không phải hai cột `<div>`: trình đọc màn hình đọc ra đúng
 * quan hệ "nhãn này thuộc về giá trị kia", còn hai div cạnh nhau thì thành hai mẩu chữ
 * rời rạc. Trong hồ sơ bệnh án - nơi mỗi giá trị chỉ có nghĩa khi biết nó là gì - khác
 * biệt này không nhỏ.
 *
 * Giá trị rỗng hiện dấu gạch, không để trống: ô trống không phân biệt được với "chưa
 * tải xong".
 */
export function DescriptionList({
  items,
  columns = 2,
  className,
}: {
  items: DescriptionItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const gridClass =
    columns === 1 ? 'sm:grid-cols-1' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';

  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4', gridClass, className)}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className={cn('min-w-0', item.wide && 'sm:col-span-full')}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</dt>
          <dd className="mt-1 text-data text-foreground">
            {item.value === null || item.value === undefined || item.value === '' ? (
              <span className="text-muted">—</span>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
