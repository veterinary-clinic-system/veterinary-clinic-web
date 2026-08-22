import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { petsApi } from '@/api/pets.api';
import { MedicalRecordStatus } from '@/types/enums';
import type { PetMedicalHistory } from '@/types/models';

import { MedicalHistoryTab } from './MedicalHistoryTab';

/**
 * Hồ sơ thú cưng có năm tab, mỗi tab một lời gọi API RIÊNG. Không tab nào được phép
 * biến một lời gọi hỏng thành "bé chưa có lần khám nào" - với bác sĩ đang đứng trước
 * con vật, hai câu đó dẫn tới hai quyết định khác nhau.
 *
 * `PrescriptionsTab` và `LaboratoryTab` cạnh đây đã có nhánh lỗi từ đầu; bốn tab dựng
 * trên `ClientPagedTable` thì không, và đó là thứ UI-12 vá.
 */

afterEach(cleanup);

vi.mock('@/api/pets.api', () => ({
  petsApi: { medicalHistory: vi.fn() },
}));

const medicalHistory = vi.mocked(petsApi.medicalHistory);

function renderTab() {
  /* `retry: false` để một lần hỏng là vào ngay `isError`, không chờ ba lần thử lại. */
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MedicalHistoryTab petId="pet-luna" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const RECORD: PetMedicalHistory = {
  medicalRecordId: 'mr-1',
  appointmentId: 'ap-1',
  status: MedicalRecordStatus.COMPLETED,
  examinedAt: '2026-08-14T09:30:00.000Z',
  doctorName: 'BS. Trần Minh Đức',
  branchName: 'Chi nhánh Quận 1',
  visitReason: 'Bỏ ăn hai ngày',
  diagnoses: [],
  notes: null,
  temperatureCelsius: 38.9,
  weightKg: 24.5,
};

describe('MedicalHistoryTab', () => {
  it('nói ra lỗi tải thay vì báo bé chưa từng đi khám', async () => {
    medicalHistory.mockRejectedValue(new Error('Network Error'));
    renderTab();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Không tải được bệnh sử của thú cưng');
    expect(screen.queryByText('Thú cưng chưa có lần khám nào được ghi hồ sơ.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy();
  });

  it('bệnh sử rỗng thật vẫn là bệnh sử rỗng, không phải lỗi', async () => {
    medicalHistory.mockResolvedValue([]);
    renderTab();

    expect(
      await screen.findByText('Thú cưng chưa có lần khám nào được ghi hồ sơ.'),
    ).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('vẽ hàng bệnh sử khi API trả về dữ liệu', async () => {
    medicalHistory.mockResolvedValue([RECORD]);
    renderTab();

    expect(await screen.findByText('BS. Trần Minh Đức')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
