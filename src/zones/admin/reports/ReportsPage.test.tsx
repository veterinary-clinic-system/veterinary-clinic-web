import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/basic';
import { ReportsPage } from '../pages/ReportsPage';

afterEach(cleanup);

vi.mock('@/api/branches.api', () => ({
  branchesApi: { list: vi.fn().mockResolvedValue([{ id: 'b1', branchName: 'Chi nhánh 1' }]) },
}));

vi.mock('@/api/employees.api', () => ({
  employeesApi: { list: vi.fn().mockResolvedValue({ data: [] }) },
}));

vi.mock('@/api/reports.api', () => ({
  reportsApi: {
    revenueSummary: vi.fn().mockResolvedValue({
      totalRevenue: 25000000,
      totalPaid: 25000000,
      totalRefunded: 0,
      totalUnpaid: 0,
      invoiceCount: 42,
      unpaidInvoiceCount: 0,
    }),
    inventory: vi.fn().mockResolvedValue({
      totalProducts: 120,
      totalMedicines: 85,
      totalVaccines: 30,
      lowStock: 2,
      outOfStock: 1,
      expiringSoon: 4,
      expired: 0,
      expiringSoonDays: 30,
    }),
    sales: vi.fn().mockResolvedValue([
      {
        itemCode: 'SP001',
        itemName: 'Thức ăn hạt Royal Canin',
        itemType: 'PRODUCT',
        quantitySold: 15,
        totalRevenue: 4500000,
      },
    ]),
    exams: vi.fn().mockResolvedValue({
      totalAppointments: 50,
      completed: 45,
      noShow: 3,
      cancelled: 2,
      noShowRate: 0.06,
      topVeterinarians: [
        { doctorId: 'doc1', doctorName: 'BS. Nguyễn Văn A', examCount: 25, noShowCount: 1 },
      ],
    }),
    revenue: vi.fn().mockResolvedValue([
      { period: '2026-10-01', totalRevenue: 12000000, invoiceCount: 20 },
      { period: '2026-10-02', totalRevenue: 13000000, invoiceCount: 22 },
    ]),
    revenueByService: vi.fn().mockResolvedValue([
      { serviceName: 'Khám tổng quát', totalRevenue: 10000000, count: 25 },
    ]),
    revenueByDoctor: vi.fn().mockResolvedValue([
      { doctorId: 'doc1', doctorName: 'BS. Nguyễn Văn A', totalRevenue: 15000000, appointmentCount: 25 },
    ]),
    aiAccuracy: vi.fn().mockResolvedValue({
      totalEvaluated: 40,
      accepted: 36,
      overridden: 4,
      acceptanceRate: 0.9,
      breakdownByColor: [
        { aiPriorityColor: 'GREEN', acceptedCount: 20, overriddenCount: 1 },
      ],
    }),
    examVolumeByDiseaseGroup: vi.fn().mockResolvedValue([
      { diseaseGroup: 'Viêm da & Ký sinh trùng', count: 18 },
    ]),
    exportSales: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('ReportsPage', () => {
  it('hiển thị tiêu đề, các tab phân loại và các thẻ thống kê tổng quan', async () => {
    renderPage();

    expect(screen.getByText('Báo cáo & Thống kê')).toBeTruthy();
    expect(screen.getByText('📊 Toàn cảnh báo cáo')).toBeTruthy();
    expect(screen.getByText('💰 Doanh thu & Dòng tiền')).toBeTruthy();
    expect(screen.getByText('🩺 Lâm sàng & Bác sĩ')).toBeTruthy();
    expect(screen.getByText('📦 Bán hàng & Kho')).toBeTruthy();
    expect(screen.getByText('🤖 Phân loại AI')).toBeTruthy();

    // Check that key metric cards are loaded
    expect(await screen.findByText('Doanh thu thuần')).toBeTruthy();
    expect(await screen.findByText('Lượt khám xong')).toBeTruthy();
    expect(await screen.findByText('Cảnh báo kho')).toBeTruthy();
    expect(await screen.findByText('Đồng thuận AI')).toBeTruthy();
  });
});
