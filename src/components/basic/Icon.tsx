import { SVGProps } from 'react';
import { cn } from './utils';

/**
 * Bộ icon của hệ thống.
 *
 * Trước đây giao diện dùng emoji (🐾 💉 🧪 ...). Emoji thì mỗi hệ điều hành vẽ một kiểu,
 * không đổi được màu theo trạng thái, và trên thanh điều hướng của một phần mềm phòng
 * khám thì đọc ra "trang web dễ thương" chứ không phải "công cụ làm việc". Emoji vẫn
 * hợp lý ở chỗ trang trí lớn (trạng thái rỗng), không hợp ở chỗ dày đặc.
 *
 * Icon vẽ bằng nét (stroke) trên lưới 24, dày 1.75 - cùng độ dày với chữ đậm ở cỡ nhỏ
 * nên đứng cạnh nhãn không bị nặng hơn. Màu luôn là `currentColor`: icon thừa hưởng màu
 * chữ của chỗ nó đứng, không cần một prop màu riêng.
 *
 * Mọi icon đều `aria-hidden`: chúng đi kèm nhãn chữ. Chỗ nào chỉ có icon (nút biểu
 * tượng) thì NÚT phải có `aria-label`, không phải icon.
 */
export type IconName =
  | 'dashboard'
  | 'calendar'
  | 'queue'
  | 'appointments'
  | 'customers'
  | 'paw'
  | 'stethoscope'
  | 'flask'
  | 'syringe'
  | 'cart'
  | 'receipt'
  | 'chart'
  | 'catalog'
  | 'box'
  | 'tag'
  | 'truck'
  | 'purchase-order'
  | 'inbox'
  | 'clipboard-check'
  | 'warehouse'
  | 'pill'
  | 'building'
  | 'id-card'
  | 'user-cog'
  | 'shield'
  | 'history'
  | 'search'
  | 'bell'
  | 'menu'
  | 'close'
  | 'plus'
  | 'filter'
  | 'download'
  | 'more'
  | 'check'
  | 'alert'
  | 'info'
  | 'phone'
  | 'mail'
  | 'map-pin'
  | 'clock'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'arrow-right'
  | 'sidebar'
  | 'logout'
  | 'user'
  | 'edit'
  | 'trash'
  | 'sparkles';

/* Mỗi giá trị là phần thân của <svg>. Giữ nguyên lưới 24 cho mọi icon. */
const PATHS: Record<IconName, JSX.Element> = {
  dashboard: (
    <>
      <path d="M4 13h6V4H4v9Z" />
      <path d="M14 20h6v-9h-6v9Z" />
      <path d="M4 20h6v-3H4v3Z" />
      <path d="M14 8h6V4h-6v4Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  queue: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2" />
    </>
  ),
  appointments: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" />
    </>
  ),
  customers: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3.5 3.5 0 0 1 0 6.9M17.5 14.5A6 6 0 0 1 21 20" />
    </>
  ),
  paw: (
    <>
      <ellipse cx="6.5" cy="10" rx="1.9" ry="2.4" />
      <ellipse cx="10.5" cy="6.6" rx="1.9" ry="2.4" />
      <ellipse cx="15" cy="6.6" rx="1.9" ry="2.4" />
      <ellipse cx="18.5" cy="10.5" rx="1.9" ry="2.4" />
      <path d="M12.4 12.2c2.6 0 4.6 2 4.6 4.2 0 1.7-1.3 2.9-3 2.9-1 0-1.3-.4-2.4-.4s-1.4.4-2.4.4c-1.7 0-3-1.2-3-2.9 0-2.2 2-4.2 4.6-4.2Z" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5 3v5a4 4 0 0 0 8 0V3" />
      <path d="M9 12v3a5 5 0 0 0 10 0v-2" />
      <circle cx="19" cy="10" r="2" />
    </>
  ),
  flask: (
    <>
      <path d="M10 3v6.2L4.9 18a2 2 0 0 0 1.7 3h10.8a2 2 0 0 0 1.7-3L14 9.2V3" />
      <path d="M8.5 3h7M7.2 14h9.6" />
    </>
  ),
  syringe: (
    <>
      <path d="m14 4 6 6M17.5 6.5 20 4M12 6l6 6-7.5 7.5H7v-3.5L12 6Z" />
      <path d="m10 10 2 2M8 12l2 2" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.5L20 8H6" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3h14v18l-2.3-1.6L14.4 21l-2.4-1.6L9.6 21l-2.3-1.6L5 21V3Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-4M12.5 16V7M17 16v-6" />
    </>
  ),
  catalog: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2V5Z" />
      <path d="M11 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
      <path d="M14 8h2M14 12h2" />
    </>
  ),
  box: (
    <>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="m4 7 8 4 8-4M12 21V11" />
    </>
  ),
  tag: (
    <>
      <path d="M3 11V4h7l10 10-7 7L3 11Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </>
  ),
  'purchase-order': (
    <>
      <path d="M8 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <rect x="8.5" y="2.5" width="7" height="3.5" rx="1" />
      <path d="M8.5 11h7M8.5 15h4.5" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13 6 5h12l2 8v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z" />
      <path d="M4 13h4l1.2 2.2h5.6L16 13h4" />
    </>
  ),
  'clipboard-check': (
    <>
      <path d="M8 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <rect x="8.5" y="2.5" width="7" height="3.5" rx="1" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  warehouse: (
    <>
      <path d="M3 20V9l9-5 9 5v11" />
      <path d="M7 20v-7h10v7M7 16h10" />
    </>
  ),
  pill: (
    <>
      <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="m9 9 6 6" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
      <path d="M15 9h3a2 2 0 0 1 2 2v10M3 21h18" />
      <path d="M8 7h3M8 11h3M8 15h3" />
    </>
  ),
  'id-card': (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16a3.2 3.2 0 0 1 6 0M14.5 10h4M14.5 14h4" />
    </>
  ),
  'user-cog': (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 9.5-4.9" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M17.5 13.6v1M17.5 20.4v1M13.6 17.5h1M20.4 17.5h1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4.5l3 1.8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 15Z" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  filter: <path d="M4 5h16l-6.2 7.3V19l-3.6 2v-8.7L4 5Z" />,
  download: (
    <>
      <path d="M12 4v10M8 11l4 4 4-4" />
      <path d="M5 19h14" />
    </>
  ),
  more: (
    <>
      <circle cx="12" cy="5.5" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="12" cy="18.5" r="1.3" />
    </>
  ),
  check: <path d="m5 13 4.5 4.5L19 7" />,
  alert: (
    <>
      <path d="M12 4 2.8 20h18.4L12 4Z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8v.01" />
    </>
  ),
  phone: (
    <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M12 21c4-4.5 6-7.8 6-10.5a6 6 0 1 0-12 0C6 13.2 8 16.5 12 21Z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.2 1.9" />
    </>
  ),
  'chevron-down': <path d="m6 9.5 6 6 6-6" />,
  'chevron-right': <path d="m9.5 6 6 6-6 6" />,
  'chevron-left': <path d="m14.5 6-6 6 6 6" />,
  'arrow-right': <path d="M4 12h15M13 6l6 6-6 6" />,
  sidebar: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9.5 4v16" />
    </>
  ),
  logout: (
    <>
      <path d="M14 5V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1" />
      <path d="M10 12h10M17 8.5l3.5 3.5-3.5 3.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m15 6 3 3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
      <path d="M10.5 11v5M13.5 11v5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13.6 8 18 9.5 13.6 11 12 15.5 10.4 11 6 9.5 10.4 8 12 3.5Z" />
      <path d="M18 15.5 18.8 18l2.2.8-2.2.8-.8 2.4-.8-2.4-2.2-.8 2.2-.8.8-2.5Z" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Cỡ mặc định 20px - vừa với nhãn 14px đứng cạnh. */
  className?: string;
}

export function Icon({ name, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('h-5 w-5 shrink-0', className)}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
