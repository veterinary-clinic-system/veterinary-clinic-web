import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { vaccinationsApi } from '@/api/vaccinations.api';
import type { VaccinationRecordView } from '@/types/models';

import { VaccinationTab } from './VaccinationTab';

/**
 * Sổ tiêm chủng là tab dễ gây hại nhất khi nhầm lỗi thành rỗng: "chưa có mũi nào" đọc
 * ra là **cần tiêm**, và bác sĩ tiêm lại một mũi bé đã có. Bài này giữ hai câu đó tách
 * bạch. Xem thêm `MedicalHistoryTab.test.tsx`.
 */

afterEach(cleanup);

vi.mock('@/api/vaccinations.api', () => ({
  vaccinationsApi: { byPet: vi.fn() },
}));

const byPet = vi.mocked(vaccinationsApi.byPet);

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <VaccinationTab petId="pet-luna" />
    </QueryClientProvider>,
  );
}

const RECORD = {
  vaccination: {
    id: 'vac-1',
    petId: 'pet-luna',
    vaccineId: 'v-rabisin',
    medicalRecordId: null,
    doctorId: 'd-1',
    doctor: { id: 'd-1', fullName: 'BS. Trần Minh Đức' },
    branchId: 'b-1',
    vaccinatedAt: '2026-03-12T02:00:00.000Z',
    doseNumber: 1,
    batchNo: 'RB2026-014',
    expiryDate: '2027-01-31',
    notes: null,
    nextDueDate: '2027-03-12',
  },
  dueStatus: 'SCHEDULED',
} as unknown as VaccinationRecordView;

describe('VaccinationTab', () => {
  it('nói ra lỗi tải thay vì báo bé chưa tiêm mũi nào', async () => {
    byPet.mockRejectedValue(new Error('Network Error'));
    renderTab();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Không tải được sổ tiêm chủng');
    expect(screen.queryByText('Thú cưng chưa có mũi tiêm nào được ghi nhận.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy();
  });

  it('sổ rỗng thật vẫn là sổ rỗng, không phải lỗi', async () => {
    byPet.mockResolvedValue([]);
    renderTab();

    expect(await screen.findByText('Thú cưng chưa có mũi tiêm nào được ghi nhận.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('vẽ mũi tiêm khi API trả về dữ liệu', async () => {
    byPet.mockResolvedValue([RECORD]);
    renderTab();

    expect(await screen.findByText('RB2026-014')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
