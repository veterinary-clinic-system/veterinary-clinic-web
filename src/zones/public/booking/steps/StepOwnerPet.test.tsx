import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appointmentsApi } from '@/api/appointments.api';
import { usersApi } from '@/api/doctors.api';
import { ToastProvider } from '@/components/basic';
import { Role } from '@/types/enums';
import { useBookingForm } from '../use-booking-form';
import { StepOwnerPet } from './StepOwnerPet';

let mockUser: { sub: string; phone: string; role: Role; branchId: string | null } | null = null;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: <T,>(value: T) => value,
}));

vi.mock('@/api/branches.api', () => ({
  branchesApi: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/api/doctors.api', () => ({
  doctorsApi: { listPublic: vi.fn().mockResolvedValue([]) },
  usersApi: { me: vi.fn() },
}));

vi.mock('@/api/pets.api', () => ({
  petsApi: { mine: vi.fn().mockResolvedValue([]) },
  speciesApi: { list: vi.fn().mockResolvedValue([]), breedsFor: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/api/catalog.api', () => ({
  catalogApi: { services: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 100 }) },
}));

vi.mock('@/api/files.api', () => ({
  filesApi: { upload: vi.fn() },
}));

vi.mock('@/api/appointments.api', () => ({
  appointmentsApi: {
    ownerLookup: vi.fn(),
    publicCalendar: vi.fn().mockResolvedValue([]),
    createPublicBooking: vi.fn(),
    createPublicCheckout: vi.fn(),
  },
}));

const ownerLookup = vi.mocked(appointmentsApi.ownerLookup);
const usersMe = vi.mocked(usersApi.me);

function StepOwnerPetHarness() {
  const form = useBookingForm();
  return <StepOwnerPet owner={form.owner} pet={form.pet} errors={form.step5Errors} />;
}

function renderHarness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>
          <StepOwnerPetHarness />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('StepOwnerPet & useBookingForm — BUG-11 Option B không lộ PII / không khóa họ tên khách vãng lai', () => {
  beforeEach(() => {
    mockUser = null;
    ownerLookup.mockResolvedValue({ found: true });
    usersMe.mockResolvedValue({
      id: 'owner-1',
      fullName: 'Nguyễn Văn Chủ',
      phone: '0901234567',
      email: 'chu@example.com',
      avatarUrl: '',
      role: Role.PET_OWNER,
      branchId: null,
      active: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('khách vãng lai tra cứu SĐT có hồ sơ ({ found: true }) không bị điền sẵn/khóa ô Họ và tên và hiện thông báo mới', async () => {
    renderHarness();

    const phoneInput = screen.getByLabelText('Số điện thoại *');
    fireEvent.change(phoneInput, { target: { value: '0912345678' } });

    await vi.waitFor(() => {
      expect(ownerLookup).toHaveBeenCalledWith('0912345678');
    });

    expect(
      await screen.findByText(
        'Số điện thoại đã có hồ sơ — vui lòng nhập họ tên để xác nhận đặt lịch.',
      ),
    ).toBeTruthy();

    const fullNameInput = screen.getByLabelText('Họ và tên *') as HTMLInputElement;
    expect(fullNameInput.value).toBe('');
    expect(fullNameInput.readOnly).toBe(false);
    expect(screen.queryByRole('button', { name: 'Sửa họ tên' })).toBeNull();

    // Khách vãng lai nhập trực tiếp họ tên
    fireEvent.change(fullNameInput, { target: { value: 'Trần Thị Khách' } });
    expect(fullNameInput.value).toBe('Trần Thị Khách');
  });

  it('chủ nuôi đã đăng nhập vẫn giữ cơ chế tự điền và khóa ô Họ và tên', async () => {
    mockUser = { sub: 'owner-1', phone: '0901234567', role: Role.PET_OWNER, branchId: null };
    renderHarness();

    const fullNameInput = screen.getByLabelText('Họ và tên *') as HTMLInputElement;
    await vi.waitFor(() => {
      expect(fullNameInput.value).toBe('Nguyễn Văn Chủ');
      expect(fullNameInput.readOnly).toBe(true);
    });
    expect(ownerLookup).not.toHaveBeenCalled();
  });
});
