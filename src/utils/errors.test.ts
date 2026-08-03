import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { getErrorMessage, isConflictError } from './errors';

/**
 * Đây là đầu kia của hợp đồng lỗi 409 mà backend tạo ra trong
 * `modules/scheduling/domain/appointment-overlap.ts`: khi hai người cùng đặt một
 * khung giờ, backend trả 409 kèm `{ message }` kiểu NestJS, và màn hình đặt lịch
 * phải hiển thị đúng câu đó thay vì "Đã xảy ra lỗi".
 */
function axiosErrorWith(status: number, data: unknown): AxiosError {
  const config = {} as InternalAxiosRequestConfig;
  const response = { data, status, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('Request failed', String(status), config, undefined, response);
}

describe('getErrorMessage', () => {
  it('lấy message dạng chuỗi từ thân lỗi của backend', () => {
    const error = axiosErrorWith(409, {
      message: 'Khung giờ này vừa có người đặt - vui lòng chọn khung giờ khác',
    });

    expect(getErrorMessage(error)).toBe(
      'Khung giờ này vừa có người đặt - vui lòng chọn khung giờ khác',
    );
  });

  it('nối mảng message của ValidationPipe thành một câu', () => {
    const error = axiosErrorWith(400, {
      message: ['phone không hợp lệ', 'startAt phải là ngày ISO 8601'],
    });

    expect(getErrorMessage(error)).toBe('phone không hợp lệ, startAt phải là ngày ISO 8601');
  });

  it('dùng câu mặc định khi lỗi không phải từ axios', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('Đã xảy ra lỗi, vui lòng thử lại.');
  });

  it('dùng câu mặc định khi mất mạng - axios không có response', () => {
    expect(getErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(
      'Đã xảy ra lỗi, vui lòng thử lại.',
    );
  });

  it('cho phép đổi câu mặc định theo ngữ cảnh màn hình', () => {
    expect(getErrorMessage(new Error('boom'), 'Không tải được lịch hẹn.')).toBe(
      'Không tải được lịch hẹn.',
    );
  });
});

describe('isConflictError', () => {
  it('chỉ đúng với HTTP 409', () => {
    expect(isConflictError(axiosErrorWith(409, {}))).toBe(true);
    expect(isConflictError(axiosErrorWith(400, {}))).toBe(false);
    expect(isConflictError(axiosErrorWith(500, {}))).toBe(false);
  });

  it('không nhầm lỗi thường thành xung đột', () => {
    expect(isConflictError(new Error('409'))).toBe(false);
    expect(isConflictError(null)).toBe(false);
  });
});
