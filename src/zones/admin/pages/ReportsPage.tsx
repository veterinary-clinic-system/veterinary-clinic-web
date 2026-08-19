import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, startOfQuarter, startOfWeek, startOfYear, subDays } from 'date-fns';
import { branchesApi } from '@/api/branches.api';
import { employeesApi } from '@/api/employees.api';
import { reportsApi, SalesReportRow } from '@/api/reports.api';
import { Button, DatePicker, Select, Table } from '@/components/basic';
import type { Column } from '@/components/basic';
import { useToast } from '@/components/basic/Toast';
import { PaymentMethod, PRIORITY_COLOR_LABEL_VI, PriorityColor } from '@/types/enums';
import { PAYMENT_METHOD_LABEL_VI } from '@/utils/labels';
import { formatCurrency } from '@/utils/format';

type Preset = 'week' | 'month' | 'quarter' | 'year' | 'last30';

const TODAY = new Date();
const ISO = 'yyyy-MM-dd';

/** Mốc bắt đầu của từng kỳ dựng sẵn — acceptance P10-T4 đòi lọc theo tuần/tháng/quý/năm. */
const PRESET_START: Record<Preset, () => Date> = {
  last30: () => subDays(TODAY, 30),
  week: () => startOfWeek(TODAY, { weekStartsOn: 1 }),
  month: () => startOfMonth(TODAY),
  quarter: () => startOfQuarter(TODAY),
  year: () => startOfYear(TODAY),
};

const PRESET_LABEL: Record<Preset, string> = {
  last30: '30 ngày qua',
  week: 'Tuần này',
  month: 'Tháng này',
  quarter: 'Quý này',
  year: 'Năm nay',
};

/**
 * Bốn nhóm báo cáo của SRS mục 19 — P10-T4.
 *
 * BR-15: cả trang nằm sau `REPORT_VIEW`; trong ma trận mặc định chỉ ADMIN và MANAGER có
 * quyền đó, lễ tân vào sẽ nhận 403 từ backend (router cũng đã chặn trước).
 *
 * Doanh thu ở đây có HAI con số khác nhau và đó là chủ ý, không phải lỗi: bảng "theo
 * thời gian" cộng giá trị hàng đã bán trên hoá đơn, còn thẻ tổng hợp cộng tiền thực thu
 * từ bảng `payments`. Một hoá đơn trả làm hai lần hoặc hoàn một phần sẽ làm hai con số
 * lệch nhau — xem ghi chú đầu `OperationalReportsService` phía backend.
 */
export function ReportsPage() {
  const toast = useToast();
  const [preset, setPreset] = useState<Preset>('last30');
  const [from, setFrom] = useState<string | null>(format(subDays(TODAY, 30), ISO));
  const [to, setTo] = useState<string | null>(format(TODAY, ISO));
  const [branchId, setBranchId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [employeeUserId, setEmployeeUserId] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
  const [exporting, setExporting] = useState(false);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const employeesQuery = useQuery({
    queryKey: ['report-employees'],
    queryFn: () => employeesApi.list({ limit: 100 }),
  });

  function applyPreset(value: Preset) {
    setPreset(value);
    setFrom(format(PRESET_START[value](), ISO));
    setTo(format(TODAY, ISO));
  }

  // Sửa tay ngày bắt đầu/kết thúc thì kỳ dựng sẵn không còn mô tả đúng khoảng đang xem.
  function setCustomFrom(value: string | null) {
    setFrom(value);
    setPreset('last30');
  }

  const range = { from: from ?? format(subDays(TODAY, 30), ISO), to: to ?? format(TODAY, ISO) };
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
    queryFn: () =>
      reportsApi.revenue({ ...range, branchId: branchId || undefined, groupBy }),
  });
  const byServiceQuery = useQuery({
    queryKey: ['report-revenue-by-service', ...key],
    queryFn: () => reportsApi.revenueByService({ ...range, branchId: branchId || undefined }),
  });
  const byDoctorQuery = useQuery({
    queryKey: ['report-revenue-by-doctor', ...key],
    queryFn: () => reportsApi.revenueByDoctor({ ...range, branchId: branchId || undefined }),
  });
  const aiAccuracyQuery = useQuery({
    queryKey: ['report-ai-accuracy', ...key],
    queryFn: () => reportsApi.aiAccuracy({ ...range, branchId: branchId || undefined }),
  });

  /**
   * Tải CSV bằng blob + link tạm chứ không mở thẳng URL: endpoint nằm sau `Authorization`
   * header, mà một thẻ `<a href>` hay `window.open` không mang được header nào — nó sẽ
   * nhận đúng 401.
   */
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
    } catch {
      toast.show('Không xuất được file báo cáo.', 'error');
    } finally {
      setExporting(false);
    }
  }

  const salesColumns: Column<SalesReportRow>[] = [
    {
      key: 'itemCode',
      header: 'Mã hàng',
      render: (row) => <span className="font-mono text-xs text-muted">{row.itemCode}</span>,
    },
    { key: 'itemName', header: 'Mặt hàng', render: (row) => row.itemName },
    {
      key: 'quantitySold',
      header: 'Số lượng bán',
      render: (row) => (
        <span className="[font-variant-numeric:tabular-nums]">
          {row.quantitySold.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'totalRevenue',
      header: 'Doanh thu',
      render: (row) => (
        <span className="[font-variant-numeric:tabular-nums]">{formatCurrency(row.totalRevenue)}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Báo cáo</h1>

      <div className="flex flex-col gap-4 rounded border border-border bg-surface p-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESET_LABEL) as Preset[]).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={preset === value ? 'primary' : 'secondary'}
              onClick={() => applyPreset(value)}
            >
              {PRESET_LABEL[value]}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DatePicker label="Từ ngày" value={from} onChange={setCustomFrom} max={to ?? undefined} />
          <DatePicker label="Đến ngày" value={to} onChange={setTo} min={from ?? undefined} />
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
            label="Nhân viên thu tiền"
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
              { value: 'day', label: 'Ngày' },
              { value: 'month', label: 'Tháng' },
            ]}
          />
        </div>
      </div>

      {/* -------------------------------------------------- Báo cáo doanh thu */}
      <Section
        title="Tổng hợp doanh thu"
        hint="Tiền thực thu, đọc từ các giao dịch thanh toán trong kỳ."
      >
        {summaryQuery.data && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <Stat label="Doanh thu thuần" value={formatCurrency(summaryQuery.data.totalRevenue)} />
            <Stat label="Đã thu" value={formatCurrency(summaryQuery.data.totalPaid)} />
            <Stat label="Đã hoàn" value={formatCurrency(summaryQuery.data.totalRefunded)} />
            <Stat label="Còn phải thu" value={formatCurrency(summaryQuery.data.totalUnpaid)} />
            <Stat label="Số hóa đơn đã thu" value={summaryQuery.data.invoiceCount} />
            <Stat label="Hóa đơn chưa thu đủ" value={summaryQuery.data.unpaidInvoiceCount} />
          </div>
        )}
        {summaryQuery.isLoading && <p className="text-muted">Đang tải…</p>}
      </Section>

      <Section title="Doanh thu theo thời gian" hint="Giá trị hàng đã bán trên hoá đơn.">
        <SimpleTable
          loading={revenueQuery.isLoading}
          rows={revenueQuery.data ?? []}
          columns={[
            { header: 'Kỳ', cell: (r) => r.period },
            { header: 'Doanh thu', cell: (r) => formatCurrency(r.totalRevenue), align: 'right' },
            { header: 'Số hóa đơn', cell: (r) => r.invoiceCount, align: 'right' },
          ]}
          emptyText="Không có dữ liệu doanh thu trong kỳ."
        />
      </Section>

      {/* ----------------------------------------------------- Báo cáo kho */}
      <Section
        title="Báo cáo kho"
        hint={
          inventoryQuery.data
            ? `Ảnh chụp tại thời điểm xem — không phụ thuộc khoảng ngày. "Sắp hết hạn" tính trong ${inventoryQuery.data.expiringSoonDays} ngày tới.`
            : 'Ảnh chụp tại thời điểm xem — không phụ thuộc khoảng ngày.'
        }
      >
        {inventoryQuery.data && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
            <Stat label="Sản phẩm" value={inventoryQuery.data.totalProducts} />
            <Stat label="Thuốc" value={inventoryQuery.data.totalMedicines} />
            <Stat label="Vắc-xin" value={inventoryQuery.data.totalVaccines} />
            <Stat label="Sắp hết hàng" value={inventoryQuery.data.lowStock} tone="warn" />
            <Stat label="Hết hàng" value={inventoryQuery.data.outOfStock} tone="bad" />
            <Stat label="Sắp hết hạn" value={inventoryQuery.data.expiringSoon} tone="warn" />
            <Stat label="Đã hết hạn" value={inventoryQuery.data.expired} tone="bad" />
          </div>
        )}
        {inventoryQuery.isLoading && <p className="text-muted">Đang tải…</p>}
      </Section>

      {/* ------------------------------------------------ Báo cáo bán hàng */}
      <Section
        title="Báo cáo bán hàng"
        hint="Mặt hàng bán chạy nhất trong kỳ, nhiều nhất trước."
        action={
          <Button
            variant="secondary"
            size="sm"
            loading={exporting}
            onClick={() => void exportSales()}
          >
            Xuất CSV
          </Button>
        }
      >
        <Table
          columns={salesColumns}
          data={salesQuery.data ?? []}
          getRowId={(row) => row.itemCode}
          loading={salesQuery.isLoading}
          emptyMessage="Không có giao dịch bán hàng nào trong kỳ."
        />
      </Section>

      {/* ---------------------------------------------------- Báo cáo khám */}
      <Section title="Báo cáo khám" hint="Tỉ lệ vắng mặt tính trên các lịch hẹn đã đến hạn trong kỳ.">
        {examsQuery.data && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <Stat label="Tổng lịch hẹn" value={examsQuery.data.totalAppointments} />
              <Stat label="Đã khám xong" value={examsQuery.data.completed} />
              <Stat label="Vắng mặt" value={examsQuery.data.noShow} tone="warn" />
              <Stat label="Đã hủy" value={examsQuery.data.cancelled} />
              <Stat
                label="Tỉ lệ vắng"
                value={`${Math.round(examsQuery.data.noShowRate * 100)}%`}
                tone={examsQuery.data.noShowRate > 0.15 ? 'bad' : undefined}
              />
            </div>
            <SimpleTable
              loading={false}
              rows={examsQuery.data.topVeterinarians}
              columns={[
                { header: 'Bác sĩ', cell: (r) => r.doctorName },
                { header: 'Số lượt', cell: (r) => r.examCount, align: 'right' },
                { header: 'Vắng mặt', cell: (r) => r.noShowCount, align: 'right' },
              ]}
              emptyText="Không có lượt khám nào trong kỳ."
            />
          </div>
        )}
        {examsQuery.isLoading && <p className="text-muted">Đang tải…</p>}
      </Section>

      <Section title="Doanh thu theo dịch vụ">
        <SimpleTable
          loading={byServiceQuery.isLoading}
          rows={byServiceQuery.data ?? []}
          columns={[
            { header: 'Dịch vụ', cell: (r) => r.serviceName },
            { header: 'Doanh thu', cell: (r) => formatCurrency(r.totalRevenue), align: 'right' },
            { header: 'Số lượt', cell: (r) => r.count, align: 'right' },
          ]}
          emptyText="Không có dữ liệu."
        />
      </Section>

      <Section title="Doanh thu theo bác sĩ">
        <SimpleTable
          loading={byDoctorQuery.isLoading}
          rows={byDoctorQuery.data ?? []}
          columns={[
            { header: 'Bác sĩ', cell: (r) => r.doctorName },
            { header: 'Doanh thu', cell: (r) => formatCurrency(r.totalRevenue), align: 'right' },
            { header: 'Số lịch hẹn', cell: (r) => r.appointmentCount, align: 'right' },
          ]}
          emptyText="Không có dữ liệu."
        />
      </Section>

      <Section
        title="Độ chính xác phân loại AI"
        hint="Tỉ lệ nhân viên chấp nhận hay ghi đè mức độ ưu tiên do AI đề xuất."
      >
        {aiAccuracyQuery.data && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Tổng số đánh giá" value={aiAccuracyQuery.data.totalEvaluated} />
              <Stat label="Chấp nhận AI" value={aiAccuracyQuery.data.accepted} />
              <Stat label="Ghi đè AI" value={aiAccuracyQuery.data.overridden} />
              <Stat
                label="Tỉ lệ chấp nhận"
                value={`${Math.round(aiAccuracyQuery.data.acceptanceRate * 100)}%`}
              />
            </div>
            <SimpleTable
              loading={false}
              rows={aiAccuracyQuery.data.breakdownByColor}
              columns={[
                {
                  header: 'Mức độ ưu tiên (AI)',
                  cell: (r) =>
                    PRIORITY_COLOR_LABEL_VI[r.aiPriorityColor as PriorityColor] ?? r.aiPriorityColor,
                },
                { header: 'Chấp nhận', cell: (r) => r.acceptedCount, align: 'right' },
                { header: 'Ghi đè', cell: (r) => r.overriddenCount, align: 'right' },
              ]}
              emptyText="Không có dữ liệu."
            />
          </div>
        )}
        {aiAccuracyQuery.isLoading && <p className="text-muted">Đang tải…</p>}
      </Section>
    </div>
  );
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">{title}</h2>
          {hint && <p className="text-sm text-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  /** Tô màu chỉ khi con số là một tín hiệu cần xử lý — không tô cho vui. */
  tone?: 'warn' | 'bad';
}) {
  const toneClass =
    tone === 'bad' ? 'text-triage-red' : tone === 'warn' ? 'text-triage-yellow' : '';
  return (
    <div className="rounded border border-border p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-xl font-semibold ${value === 0 ? 'text-muted' : toneClass}`}>{value}</p>
    </div>
  );
}

interface SimpleColumn<T> {
  header: string;
  cell: (row: T) => string | number;
  align?: 'left' | 'right';
}

function SimpleTable<T>({
  rows,
  columns,
  loading,
  emptyText,
}: {
  rows: T[];
  columns: SimpleColumn<T>[];
  loading: boolean;
  emptyText: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="bg-surface-muted text-left">
            {columns.map((c) => (
              <th
                key={c.header}
                className={`px-3 py-2 ${c.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-muted">
                Đang tải…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-muted">
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-border">
              {columns.map((c) => (
                <td
                  key={c.header}
                  className={`px-3 py-2 ${c.align === 'right' ? 'text-right [font-variant-numeric:tabular-nums]' : 'text-left'}`}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
