import { useLocation } from 'react-router-dom';
import type { Crumb } from '@/components/basic';
import { ALL_NAV_ITEMS } from './nav-model';

/**
 * Nhãn cho những đoạn đường dẫn KHÔNG có mục điều hướng tương ứng - phần lớn là các
 * trang chi tiết nằm dưới một trang danh sách.
 */
const LEAF_LABELS: Record<string, string> = {
  exam: 'Phiếu khám',
  alerts: 'Cảnh báo kho',
  due: 'Nhắc lịch tiêm',
};

/** Đoạn nào trông giống một mã định danh thì không đem ra làm nhãn breadcrumb. */
function isIdSegment(segment: string): boolean {
  return /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment);
}

/**
 * Dựng breadcrumb từ URL thay vì để mỗi trang tự khai báo.
 *
 * Khai báo tay ở 30 trang thì chắc chắn có trang quên, có trang viết sai tên nhóm sau
 * một lần đổi điều hướng, và không có cách nào phát hiện. Suy ra từ URL thì cây điều
 * hướng và breadcrumb không thể lệch nhau - cùng đọc một `nav-model.ts`.
 *
 * `detailLabel` để trang chi tiết đưa vào tên bản ghi đang mở ("Luna", "HD-2026-0142")
 * thay cho mã định danh trong URL - thứ không nói gì với người đọc.
 */
export function useBreadcrumbs(detailLabel?: string): Crumb[] {
  const { pathname } = useLocation();

  if (pathname === '/staff') return [{ label: 'Tổng quan' }];

  const crumbs: Crumb[] = [{ label: 'Tổng quan', to: '/staff' }];
  const segments = pathname.split('/').filter(Boolean).slice(1); // bỏ "staff"

  let accumulated = '/staff';
  segments.forEach((segment, index) => {
    accumulated += `/${segment}`;
    const last = index === segments.length - 1;

    if (isIdSegment(segment)) {
      /* Trang chi tiết: dùng tên bản ghi nếu trang đã truyền vào, còn không thì bỏ hẳn
         đoạn này - "Lịch hẹn / 3f8a-..." không giúp được ai. */
      if (detailLabel) crumbs.push({ label: detailLabel, to: last ? undefined : accumulated });
      return;
    }

    const navItem = ALL_NAV_ITEMS.find((item) => item.to === accumulated);
    const label = navItem?.label ?? LEAF_LABELS[segment];
    if (!label) return;

    crumbs.push({ label, to: last ? undefined : accumulated });
  });

  return crumbs;
}
