import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { branchesApi } from '@/api/branches.api';
import { reportsApi } from '@/api/reports.api';
import { PRIORITY_COLOR_LABEL_VI, PriorityColor } from '@/types/enums';
import { formatCurrency } from '@/utils/format';

/** Admin/Receptionist reporting dashboard: revenue, exam volume, and AI-triage accuracy. */
export function ReportsPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [branchId, setBranchId] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  const params = { from, to, branchId: branchId || undefined };

  const revenueQuery = useQuery({
    queryKey: ['report-revenue', from, to, branchId, groupBy],
    queryFn: () => reportsApi.revenue({ ...params, groupBy }),
  });
  const byServiceQuery = useQuery({
    queryKey: ['report-revenue-by-service', from, to, branchId],
    queryFn: () => reportsApi.revenueByService(params),
  });
  const byDoctorQuery = useQuery({
    queryKey: ['report-revenue-by-doctor', from, to, branchId],
    queryFn: () => reportsApi.revenueByDoctor(params),
  });
  const examVolumeQuery = useQuery({
    queryKey: ['report-exam-volume', from, to, branchId],
    queryFn: () => reportsApi.examVolumeByDiseaseGroup(params),
  });
  const aiAccuracyQuery = useQuery({
    queryKey: ['report-ai-accuracy', from, to, branchId],
    queryFn: () => reportsApi.aiAccuracy(params),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Báo cáo</h1>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Từ ngày</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Đến ngày</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Chi nhánh</span>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded border border-border bg-surface px-3 py-2 text-sm">
            <option value="">Tất cả chi nhánh</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Nhóm theo</span>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as 'day' | 'month')} className="rounded border border-border bg-surface px-3 py-2 text-sm">
            <option value="day">Ngày</option>
            <option value="month">Tháng</option>
          </select>
        </label>
      </div>

      <section className="rounded border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium">Doanh thu theo thời gian</h2>
        <SimpleTable
          loading={revenueQuery.isLoading}
          rows={revenueQuery.data ?? []}
          columns={[
            { header: 'Kỳ', cell: (r) => r.period },
            { header: 'Doanh thu', cell: (r) => formatCurrency(r.totalRevenue), align: 'right' },
            { header: 'Số hóa đơn', cell: (r) => r.invoiceCount, align: 'right' },
          ]}
          emptyText="Không có dữ liệu doanh thu."
        />
      </section>

      <section className="rounded border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium">Doanh thu theo dịch vụ</h2>
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
      </section>

      <section className="rounded border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium">Doanh thu theo bác sĩ</h2>
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
      </section>

      <section className="rounded border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium">Số lượt khám theo nhóm bệnh</h2>
        <SimpleTable
          loading={examVolumeQuery.isLoading}
          rows={examVolumeQuery.data ?? []}
          columns={[
            { header: 'Nhóm bệnh', cell: (r) => r.diseaseGroup },
            { header: 'Số lượt', cell: (r) => r.count, align: 'right' },
          ]}
          emptyText="Không có dữ liệu."
        />
      </section>

      <section className="rounded border border-border bg-surface p-4">
        <h2 className="mb-1 font-medium">Độ chính xác phân loại AI</h2>
        <p className="mb-3 text-sm text-muted">
          Tỉ lệ nhân viên chấp nhận (accept) hay ghi đè (override) mức độ ưu tiên do AI đề xuất.
        </p>
        {aiAccuracyQuery.isLoading ? (
          <p className="text-muted">Đang tải…</p>
        ) : aiAccuracyQuery.data ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Tổng số đánh giá" value={aiAccuracyQuery.data.totalEvaluated} />
              <Stat label="Chấp nhận AI" value={aiAccuracyQuery.data.accepted} />
              <Stat label="Ghi đè AI" value={aiAccuracyQuery.data.overridden} />
              <Stat label="Tỉ lệ chấp nhận" value={`${Math.round(aiAccuracyQuery.data.acceptanceRate * 100)}%`} />
            </div>
            <SimpleTable
              loading={false}
              rows={aiAccuracyQuery.data.breakdownByColor}
              columns={[
                {
                  header: 'Mức độ ưu tiên (AI)',
                  cell: (r) => PRIORITY_COLOR_LABEL_VI[r.aiPriorityColor as PriorityColor] ?? r.aiPriorityColor,
                },
                { header: 'Chấp nhận', cell: (r) => r.acceptedCount, align: 'right' },
                { header: 'Ghi đè', cell: (r) => r.overriddenCount, align: 'right' },
              ]}
              emptyText="Không có dữ liệu."
            />
          </div>
        ) : (
          <p className="text-destructive">Không thể tải báo cáo AI.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-border p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

interface Column<T> {
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
  columns: Column<T>[];
  loading: boolean;
  emptyText: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="bg-surface-muted text-left">
            {columns.map((c) => (
              <th key={c.header} className={`px-3 py-2 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
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
                <td key={c.header} className={`px-3 py-2 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
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
