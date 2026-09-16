import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@/types/enums';
import { StaffSidebar } from './StaffSidebar';

afterEach(cleanup);

function sidebar(role = Role.ADMIN, path = '/staff') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <StaffSidebar role={role} collapsed={false} onToggleCollapse={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('Grouped staff navigation', () => {
  it('opens and folds a group using its accessible button', () => {
    sidebar();
    const group = screen.getByRole('button', { name: 'Kho & cung ứng' });
    expect(group.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(group);
    expect(screen.getByRole('link', { name: 'Tồn kho' })).toBeTruthy();
    fireEvent.click(group);
    expect(screen.queryByRole('link', { name: 'Tồn kho' })).toBeNull();
  });

  it('finds Vietnamese labels without accents and reports no results', () => {
    sidebar();
    const search = screen.getByRole('searchbox', { name: 'Tìm chức năng' });
    fireEvent.change(search, { target: { value: 'hoa don' } });
    expect(screen.getByRole('link', { name: 'Hoá đơn' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Kho & cung ứng' })).toBeNull();
    fireEvent.change(search, { target: { value: 'khong-co-chuc-nang-nay' } });
    expect(screen.getByText('Không tìm thấy chức năng. Thử từ khóa khác.')).toBeTruthy();
  });

  it('does not reveal restricted functions through search', () => {
    sidebar(Role.DOCTOR);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tai khoan' } });
    expect(screen.queryByRole('link', { name: 'Tài khoản' })).toBeNull();
  });

  it('opens the current group and marks only the exact inventory page active', () => {
    sidebar(Role.ADMIN, '/staff/inventory/alerts');
    expect(
      screen.getByRole('button', { name: 'Kho & cung ứng' }).getAttribute('aria-expanded'),
    ).toBe('true');
    expect(screen.getByRole('link', { name: 'Cảnh báo kho' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getByRole('link', { name: 'Tồn kho' }).getAttribute('aria-current')).toBeNull();
  });
});
