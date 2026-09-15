import { useLocation } from 'react-router-dom';
import type { Crumb } from '@/components/basic';
import { ALL_NAV_ITEMS } from './nav-model';

const LEAF_LABELS: Record<string, string> = {
  exam: 'Phiếu khám',
  alerts: 'Cảnh báo kho',
  due: 'Nhắc lịch tiêm',
};

function isIdSegment(segment: string): boolean {
  return /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment);
}

export function useBreadcrumbs(detailLabel?: string): Crumb[] {
  const { pathname } = useLocation();

  if (pathname === '/staff') return [{ label: 'Tổng quan' }];

  const crumbs: Crumb[] = [{ label: 'Tổng quan', to: '/staff' }];
  const segments = pathname.split('/').filter(Boolean).slice(1); 

  let accumulated = '/staff';
  segments.forEach((segment, index) => {
    accumulated += `/${segment}`;
    const last = index === segments.length - 1;

    if (isIdSegment(segment)) {
      
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
