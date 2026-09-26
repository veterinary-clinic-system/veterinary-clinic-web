import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { petsApi, type OwnerPetHealthRecord } from '@/api/pets.api';
import { HealthRecordTab } from './HealthRecordTab';

afterEach(cleanup);

vi.mock('@/api/pets.api', () => ({
  petsApi: { ownerHealthRecord: vi.fn() },
}));

const ownerHealthRecord = vi.mocked(petsApi.ownerHealthRecord);

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HealthRecordTab petId="pet-luna" />
    </QueryClientProvider>,
  );
}

describe('HealthRecordTab', () => {
  it('shows all owner-visible health record groups', async () => {
    ownerHealthRecord.mockResolvedValue({
      medicalHistory: [],
      vaccinations: [],
      prescriptions: [],
      labTests: [],
      invoices: [],
    } satisfies OwnerPetHealthRecord);

    renderTab();

    expect(await screen.findByText('Sổ tiêm chủng')).toBeTruthy();
    expect(screen.getByText('Đơn thuốc')).toBeTruthy();
    expect(screen.getByText('Kết quả xét nghiệm')).toBeTruthy();
    expect(screen.getByText('Hóa đơn khám bệnh')).toBeTruthy();
    expect(screen.getAllByText('Chưa có dữ liệu.')).toHaveLength(4);
  });

  it('shows a retryable error without presenting an empty record', async () => {
    ownerHealthRecord.mockRejectedValue(new Error('Forbidden'));

    renderTab();

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Không tải được hồ sơ sức khỏe',
    );
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy();
    expect(screen.queryByText('Chưa có dữ liệu.')).toBeNull();
  });
});
