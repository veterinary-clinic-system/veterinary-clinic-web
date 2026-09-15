import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/context/AuthContext';
import { QueryErrorState } from './QueryErrorState';

afterEach(cleanup);

function axiosErrorWith(status: number): AxiosError {
  const config = {} as InternalAxiosRequestConfig;
  const response = { data: {}, status, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('Request failed', String(status), config, undefined, response);
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

describe('QueryErrorState', () => {
  it('403 hiện màn hình thiếu quyền, KHÔNG có nút thử lại', () => {
    const onRetry = vi.fn();
    renderWithProviders(<QueryErrorState error={axiosErrorWith(403)} onRetry={onRetry} />);

    expect(screen.getByText('Bạn không có quyền truy cập trang này')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull();
  });

  it('403 vẫn cho một lối ra, không bỏ người dùng ở ngõ cụt', () => {
    renderWithProviders(<QueryErrorState error={axiosErrorWith(403)} />);

    expect(screen.getByRole('link', { name: 'Về trang chủ' }).getAttribute('href')).toBe('/');
  });

  it('lỗi 500 hiện lỗi tải dữ liệu kèm nút thử lại', () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <QueryErrorState
        error={axiosErrorWith(500)}
        title="Không tải được tồn kho"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('Không tải được tồn kho')).toBeTruthy();
    screen.getByRole('button', { name: 'Thử lại' }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('lỗi mất mạng (không có response) vẫn là lỗi tải, không phải thiếu quyền', () => {
    renderWithProviders(
      <QueryErrorState error={new AxiosError('Network Error', 'ERR_NETWORK')} onRetry={() => {}} />,
    );

    expect(screen.queryByText('Bạn không có quyền truy cập trang này')).toBeNull();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy();
  });
});
