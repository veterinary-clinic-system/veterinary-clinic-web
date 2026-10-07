import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subDays,
} from 'date-fns';
import { branchesApi } from '@/api/branches.api';
import { employeesApi } from '@/api/employees.api';
import { reportsApi } from '@/api/reports.api';
import { Button, DatePicker, PageHeader, Select, Tabs } from '@/components/basic';
import type { TabItem } from '@/components/basic';
import { useToast } from '@/components/basic/Toast';
import { PaymentMethod } from '@/types/enums';
import { PAYMENT_METHOD_LABEL_VI } from '@/utils/labels';

import { ReportStatsHeader } from '../reports/ReportStatsHeader';
import { RevenueTimelineChart } from '../reports/RevenueTimelineChart';
import { ServiceRevenueChart } from '../reports/ServiceRevenueChart';
import { DoctorRevenueChart } from '../reports/DoctorRevenueChart';
import { AppointmentsAnalyticsCard } from '../reports/AppointmentsAnalyticsCard';
import { DiseaseDistributionChart } from '../reports/DiseaseDistributionChart';
import { SalesReportCard } from '../reports/SalesReportCard';
import { InventoryHealthCard } from '../reports/InventoryHealthCard';
import { AiAccuracyReportCard } from '../reports/AiAccuracyReportCard';

type Preset = 'last30' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
type ReportTab = 'all' | 'revenue' | 'clinical' | 'sales_inventory' | 'ai';

const ISO = 'yyyy-MM-dd';

const PRESET_START: Record<Exclude<Preset, 'custom'>, (today: Date) => Date> = {
  last30: (today) => subDays(today, 30),
  week: (today) => startOfWeek(today, { weekStartsOn: 1 }),
  month: (today) => startOfMonth(today),
  quarter: (today) => startOfQuarter(today),
  year: (today) => startOfYear(today),
};

const PRESET_LABEL: Record<Exclude<Preset, 'custom'>, string> = {
  last30: '30 ngày qua',
  week: 'Tuần này',
  month: 'Tháng này',
  quarter: 'Quý này',
  year: 'Năm nay',
};

const TABS: TabItem<ReportTab>[] = [
  { id: 'all', label: '📊 Toàn cảnh báo cáo' },
  { id: 'revenue', label: '💰 Doanh thu & Dòng tiền' },
  { id: 'clinical', label: '🩺 Lâm sàng & Bác sĩ' },
  { id: 'sales_inventory', label: '📦 Bán hàng & Kho' },
  { id: 'ai', label: '🤖 Phân loại AI' },
];

export function ReportsPage() {
  const toast = useToast();
  const today = startOfDay(new Date());

  const [activeTab, setActiveTab] = useState<ReportTab>('all');
  const [preset, setPreset] = useState<Preset>('last30');
  const [from, setFrom] = useState<string | null>(format(subDays(today, 30), ISO));
  const [to, setTo] = useState<string | null>(format(today, ISO));
  const [branchId, setBranchId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [employeeUserId, setEmployeeUserId] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const employeesQuery = useQuery({
    queryKey: ['report-employees'],
    queryFn: () => employeesApi.list({ limit: 100 }),
  });

  function applyPreset(value: Exclude<Preset, 'custom'>) {
    setPreset(value);
    const currentToday = startOfDay(new Date());
    setFrom(format(PRESET_START[value](currentToday), ISO));
    setTo(format(currentToday, ISO));
  }

  function setCustomFrom(value: string | null) {
    setFrom(value);
    setPreset('custom');
  }

  function resetFilters() {
    applyPreset('last30');
    setBranchId('');
    setPaymentMethod('');
    setEmployeeUserId('');
    setGroupBy('day');
  }

  const range = { from: from ?? format(subDays(today, 30), ISO), to: to ?? format(today, ISO) };
  const filters = {
    ...range,
    branchId: branchId || undefined,
    paymentMethod: paymentMethod || undefined,
    employeeUserId: employeeUserId || undefined,
  };
  const key = [range.from, range.to, branchId, paymentMethod, employeeUserId];

  const summaryQuery = useQuery({
    queryKey: ['report-revenue-summary', ...key],
    queryFn: () => reportsApi.revenueSummary(filters),
  });
  const inventoryQuery = useQuery({
    queryKey: ['report-inventory', branchId],
    queryFn: () => reportsApi.inventory(branchId || undefined),
  });
  const salesQuery = useQuery({
    queryKey: ['report-sales', ...key],
    queryFn: () => reportsApi.sales(filters),
  });
  const examsQuery = useQuery({
    queryKey: ['report-exams', range.from, range.to, branchId],
    queryFn: () => reportsApi.exams({ ...range, branchId: branchId || undefined }),
  });
  const revenueQuery = useQuery({
    queryKey: ['report-revenue', ...key, groupBy],
    queryFn: () => reportsApi.revenue({ ...filters, groupBy }),
  });
  const byServiceQuery = useQuery({
    queryKey: ['report-revenue-by-service', ...key],
    queryFn: () => reportsApi.revenueByService(filters),
  });
  const byDoctorQuery = useQuery({
    queryKey: ['report-revenue-by-doctor', ...key],
    queryFn: () => reportsApi.revenueByDoctor(filters),
  });
  const aiAccuracyQuery = useQuery({
    queryKey: ['report-ai-accuracy', ...key],
    queryFn: () => reportsApi.aiAccuracy({ ...range, branchId: branchId || undefined }),
  });
  const diseaseQuery = useQuery({
    queryKey: ['report-disease-groups', range.from, range.to, branchId],
    queryFn: () =>
      reportsApi.examVolumeByDiseaseGroup({ ...range, branchId: branchId || undefined }),
  });

  const reportQueries = [
    summaryQuery,
    inventoryQuery,
    salesQuery,
    examsQuery,
    revenueQuery,
    byServiceQuery,
    byDoctorQuery,
    aiAccuracyQuery,
    diseaseQuery,
  ];
  const hasReportError = reportQueries.some((query) => query.isError);

  function retryFailedReports() {
    reportQueries.filter((query) => query.isError).forEach((query) => void query.refetch());
  }

  async function exportSales() {
    setExporting(true);
    try {
      const blob = await reportsApi.exportSales(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-ban-hang-${range.from}-${range.to}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.show('Xuất file báo cáo thành công.', 'success');
    } catch {
      toast.show('Không xuất được file báo cáo.', 'error');
    } finally {
      setExporting(false);
    }
  }

  const isFiltered = Boolean(branchId || paymentMethod || employeeUserId || preset === 'custom');

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <PageHeader
        title="Báo cáo & Thống kê"
        description="Tổng quan doanh thu, số liệu lâm sàng, tình trạng kho và chất lượng gợi ý AI."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters((prev) => !prev)}
              className="text-xs"
            >
              <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Bộ lọc nâng cao {isFiltered && '(Đang lọc)'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={exporting}
              onClick={() => void exportSales()}
              className="text-xs"
            >
              <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Xuất CSV bán hàng
            </Button>
          </div>
        }
      />

      {/* Date Presets and Fast Filter Bar */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted">Khoảng thời gian:</span>
            {(Object.keys(PRESET_LABEL) as Exclude<Preset, 'custom'>[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => applyPreset(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  preset === value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-surface-muted/70 text-foreground hover:bg-surface-muted hover:text-foreground'
                }`}
              >
                {PRESET_LABEL[value]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Từ: <strong className="text-foreground">{range.from}</strong></span>
            <span>Đến: <strong className="text-foreground">{range.to}</strong></span>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-2 font-medium text-primary hover:underline"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Collapsible / Detailed Filter Row */}
        {showFilters && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <DatePicker label="Từ ngày" value={from} onChange={setCustomFrom} max={to ?? undefined} />
              <DatePicker
                label="Đến ngày"
                value={to}
                onChange={(value) => {
                  setTo(value);
                  setPreset('custom');
                }}
                min={from ?? undefined}
              />
              <Select
                label="Chi nhánh"
                value={branchId}
                onChange={setBranchId}
                options={[
                  { value: '', label: 'Tất cả chi nhánh' },
                  ...(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName })),
                ]}
              />
              <Select
                label="Phương thức thanh toán"
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  { value: '', label: 'Tất cả' },
                  ...Object.values(PaymentMethod).map((method) => ({
                    value: method,
                    label: PAYMENT_METHOD_LABEL_VI[method],
                  })),
                ]}
              />
              <Select
                label="Nhân viên thu ngân"
                value={employeeUserId}
                onChange={setEmployeeUserId}
                options={[
                  { value: '', label: 'Tất cả' },
                  ...(employeesQuery.data?.data ?? [])
                    .filter((employee) => employee.userId)
                    .map((employee) => ({
                      value: employee.userId as string,
                      label: employee.fullName,
                    })),
                ]}
              />
              <Select
                label="Nhóm doanh thu theo"
                value={groupBy}
                onChange={(value) => setGroupBy(value as 'day' | 'month')}
                options={[
                  { value: 'day', label: 'Theo Ngày' },
                  { value: 'month', label: 'Theo Tháng' },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Global Error Banner */}
      {hasReportError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm text-danger">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Một số khối báo cáo chưa tải được dữ liệu. Các khối còn lại vẫn hiển thị bình thường.</span>
          </div>
          <Button variant="secondary" size="sm" onClick={retryFailedReports}>
            Tải lại báo cáo
          </Button>
        </div>
      )}

      {/* Executive KPI Summary Header */}
      <ReportStatsHeader
        summary={summaryQuery.data}
        exams={examsQuery.data}
        inventory={inventoryQuery.data}
        ai={aiAccuracyQuery.data}
        loading={summaryQuery.isLoading || examsQuery.isLoading}
      />

      {/* Categorized Navigation Tabs */}
      <div className="border-b border-border">
        <Tabs
          items={TABS}
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          variant="line"
        />
      </div>

      {/* Tab Panels */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {/* Main Revenue Timeline Chart */}
          <RevenueTimelineChart
            data={revenueQuery.data ?? []}
            loading={revenueQuery.isLoading}
            groupBy={groupBy}
          />

          {/* 2-Column: Revenue by Service & Appointment Analytics */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ServiceRevenueChart
              data={byServiceQuery.data ?? []}
              loading={byServiceQuery.isLoading}
            />
            <AppointmentsAnalyticsCard
              data={examsQuery.data}
              loading={examsQuery.isLoading}
            />
          </div>

          {/* 2-Column: Doctor Revenue & Common Disease Groups */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DoctorRevenueChart
              data={byDoctorQuery.data ?? []}
              loading={byDoctorQuery.isLoading}
            />
            <DiseaseDistributionChart
              data={diseaseQuery.data ?? []}
              loading={diseaseQuery.isLoading}
            />
          </div>

          {/* 2-Column: Sales Products & Inventory Health */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SalesReportCard
              data={salesQuery.data ?? []}
              loading={salesQuery.isLoading}
              exporting={exporting}
              onExport={() => void exportSales()}
            />
            <InventoryHealthCard
              data={inventoryQuery.data}
              loading={inventoryQuery.isLoading}
            />
          </div>

          {/* AI Accuracy Card */}
          <AiAccuracyReportCard
            data={aiAccuracyQuery.data}
            loading={aiAccuracyQuery.isLoading}
          />
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <RevenueTimelineChart
            data={revenueQuery.data ?? []}
            loading={revenueQuery.isLoading}
            groupBy={groupBy}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ServiceRevenueChart
              data={byServiceQuery.data ?? []}
              loading={byServiceQuery.isLoading}
            />
            <DoctorRevenueChart
              data={byDoctorQuery.data ?? []}
              loading={byDoctorQuery.isLoading}
            />
          </div>
        </div>
      )}

      {activeTab === 'clinical' && (
        <div className="space-y-6">
          <AppointmentsAnalyticsCard
            data={examsQuery.data}
            loading={examsQuery.isLoading}
          />
          <DiseaseDistributionChart
            data={diseaseQuery.data ?? []}
            loading={diseaseQuery.isLoading}
          />
        </div>
      )}

      {activeTab === 'sales_inventory' && (
        <div className="space-y-6">
          <SalesReportCard
            data={salesQuery.data ?? []}
            loading={salesQuery.isLoading}
            exporting={exporting}
            onExport={() => void exportSales()}
          />
          <InventoryHealthCard
            data={inventoryQuery.data}
            loading={inventoryQuery.isLoading}
          />
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          <AiAccuracyReportCard
            data={aiAccuracyQuery.data}
            loading={aiAccuracyQuery.isLoading}
          />
        </div>
      )}
    </div>
  );
}
