import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { staffNotificationsApi } from '@/api/staff-notifications.api';
import { NotificationBell } from './NotificationBell';

vi.mock('@/api/staff-notifications.api', () => ({
  staffNotificationsApi: {
    unreadCount: vi.fn(),
    list: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

const unreadCount = vi.mocked(staffNotificationsApi.unreadCount);
const listNotifications = vi.mocked(staffNotificationsApi.list);

function renderBell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NotificationBell — BUG-14 EMERGENCY_RED', () => {
  beforeEach(() => {
    unreadCount.mockResolvedValue({ unread: 1 });
    listNotifications.mockResolvedValue({
      data: [
        {
          id: 'notif-1',
          createdAt: '2026-11-28T10:00:00.000Z',
          type: 'EMERGENCY_RED',
          title: 'Cảnh báo cấp cứu ĐỎ — Milo',
          body: 'Bé Milo vừa check-in ưu tiên ĐỎ, STT 12.',
          link: '/staff/queue?branchId=b1',
          branchId: 'b1',
          readAt: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 15,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('hiển thị nhãn "Cấp cứu ĐỎ" với tone destructive cho thông báo EMERGENCY_RED', async () => {
    renderBell();

    const trigger = await screen.findByRole('button', { name: /Thông báo/ });
    fireEvent.click(trigger);

    const badge = await screen.findByText('Cấp cứu ĐỎ');
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('bg-danger-soft');
    expect(badge.className).toContain('text-danger');
    expect(screen.getByText('Cảnh báo cấp cứu ĐỎ — Milo')).toBeTruthy();
  });
});
