import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { DashboardKpi, DashboardSeries, reportsApi } from '@/api/reports.api';
import { Select } from '@/components/basic';
import { RankBarChart } from '@/components/charts/RankBarChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { compactNumber, formatValue } from '@/components/charts/chart-utils';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/enums';
import { formatTime } from '@/utils/format';

/** Ba biểu đồ xếp hạng vẽ bằng thanh ngang; năm cái còn lại là đường theo thời gian. */
const RANK_CHARTS = new Set(['topProducts', 'topMedicines', 'topServices']);

/**
 * KPI mà TĂNG là XẤU. Delta của chúng phải đổi màu ngược lại — một mũi tên xanh trên
 * "Thuốc sắp hết +40%" là đọc sai hẳn tình hình.
 */
const LOWER_IS_BETTER = new Set(['lowStockProducts', 'lowStockMedicines', 'waitingPatients']);

/**
 * Trang tổng quan điều hành — SRS FR-24 (P10-T3).
 *
 * MỘT REQUEST cho cả 8 thẻ KPI và 8 biểu đồ (`GET /reports/dashboard`, cache Redis 60s).
 * Mở trang mà bắn 16 request song song thì vừa chậm vừa cho ra một trang có 16 trạng
 * thái tải khác nhau, nhấp nháy lệch nhau.
 *
 * BR-15: trang này dẫn đầu bằng doanh thu nên nó nằm sau `REPORT_VIEW` — trong ma trận
 * mặc định chỉ ADMIN và MANAGER có quyền đó. Các vai trò khác vẫn vào `/staff` được và
 * thấy phần điều hướng nhanh, chỉ không thấy số liệu.
 */
export function StaffDashboardPage() {
  const { user } = useAuth();
  const canViewReports = user?.role === Role.ADMIN || user?.role === Role.MANAGER;

  // Người dùng gắn với một chi nhánh thì mặc định xem chi nhánh đó; ADMIN không gắn
  // chi nhánh nào nên mặc định là toàn hệ thống.
  const [branchId, setBranchId] = useState(user?.branchId ?? '');

  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
    enabled: canViewReports,
  });

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', branchId],
    queryFn: () => reportsApi.dashboard(branchId || undefined),
    enabled: canViewReports,
  });

  if (!canViewReports) {
    return <QuickLinksOnly name={user?.phone} />;
  }

  const data = dashboardQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tổng quan</h1>
          <p className="text-muted">
            {data
              ? `Số liệu lúc ${formatTime(data.generatedAt)}`
              : 'Đang lấy số liệu điều hành…'}
          </p>
        </div>
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={setBranchId}
          options={[
            { value: '', label: 'Toàn hệ thống' },
            ...(branchesQuery.data ?? []).map((branch) => ({
              value: branch.id,
              label: branch.branchName,
            })),
          ]}
        />
      </div>

      {dashboardQuery.isError && (
        <p className="rounded border border-destructive/40 bg-destructive/5 p-4 text-destructive">
          Không tải được số liệu tổng quan. Thử tải lại trang.
        </p>
      )}

      <section aria-label="Chỉ số hôm nay">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {dashboardQuery.isLoading
            ? Array.from({ length: 8 }, (_, index) => <KpiSkeleton key={index} />)
            : (data?.kpis ?? []).map((kpi) => <KpiTile key={kpi.key} kpi={kpi} />)}
        </div>
      </section>

      <section aria-label="Biểu đồ" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {(data?.charts ?? []).map((series) => (
          <ChartCard key={series.key} series={series} />
        ))}
      </section>
    </div>
  );
}

/**
 * Thẻ KPI: nhãn · giá trị · thay đổi so với hôm qua.
 *
 * Cả thẻ là một liên kết — người xem thấy "Đang chờ khám: 7" thì việc tiếp theo họ
 * muốn làm là mở trang Hàng chờ, không phải đi tìm nó ở thanh bên.
 */
function KpiTile({ kpi }: { kpi: DashboardKpi }) {
  const body = (
    <>
      <p className="text-sm text-muted">{kpi.label}</p>
      <p className="mt-2 text-2xl font-semibold" title={formatValue(kpi.value, kpi.format)}>
        {kpi.format === 'currency' ? compactNumber(kpi.value) : kpi.value.toLocaleString('vi-VN')}
      </p>
      <DeltaBadge kpi={kpi} />
    </>
  );

  const className = 'rounded border border-border bg-surface p-4';
  return kpi.link ? (
    <Link to={kpi.link} className={`${className} block hover:bg-surface-muted`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * Màu của delta = hướng thay đổi × việc tăng là tốt hay xấu.
 *
 * `deltaRatio` null nghĩa là KHÔNG SO SÁNH ĐƯỢC (hôm qua bằng 0, hoặc chỉ số không có
 * khái niệm "hôm qua" như số đang chờ khám) — khi đó không vẽ mũi tên nào. Vẽ "+100%"
 * cho một phép chia cho 0 là bịa ra một tin tốt.
 */
function DeltaBadge({ kpi }: { kpi: DashboardKpi }) {
  if (kpi.deltaRatio === null) {
    return <p className="mt-1 text-xs text-muted">—</p>;
  }

  const percent = Math.round(kpi.deltaRatio * 100);
  const rising = percent > 0;
  const good = LOWER_IS_BETTER.has(kpi.key) ? !rising : rising;
  const tone = percent === 0 ? 'text-muted' : good ? 'text-triage-green' : 'text-triage-red';

  return (
    <p className={`mt-1 text-xs ${tone}`}>
      {percent > 0 ? '▲' : percent < 0 ? '▼' : '■'} {Math.abs(percent)}% so với hôm qua
    </p>
  );
}

function KpiSkeleton() {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="h-4 w-24 animate-pulse rounded bg-surface-muted" />
      <div className="mt-3 h-7 w-16 animate-pulse rounded bg-surface-muted" />
      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-surface-muted" />
    </div>
  );
}

/**
 * Một biểu đồ kèm bảng dữ liệu gập lại.
 *
 * Bảng không phải phần thêm cho vui: nó là đường đọc thay thế khi biểu đồ không dùng
 * được — trình đọc màn hình, in ra giấy, hoặc đơn giản là cần con số chính xác thay vì
 * ước lượng trên trục.
 */
function ChartCard({ series }: { series: DashboardSeries }) {
  const titleId = useId();

  return (
    <article className="rounded border border-border bg-surface p-4">
      <h2 id={titleId} className="mb-3 font-medium">
        {series.title}
      </h2>

      {RANK_CHARTS.has(series.key) ? (
        <RankBarChart points={series.points} format={series.format} />
      ) : (
        <TrendLineChart points={series.points} format={series.format} labelledBy={titleId} />
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-muted">Xem dạng bảng</summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-muted text-left">
                <th className="px-3 py-2">Mốc</th>
                <th className="px-3 py-2 text-right">Giá trị</th>
              </tr>
            </thead>
            <tbody>
              {series.points.map((point) => (
                <tr key={point.label} className="border-t border-border">
                  <td className="px-3 py-1.5">{point.label}</td>
                  <td className="px-3 py-1.5 text-right [font-variant-numeric:tabular-nums]">
                    {formatValue(point.value, series.format)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}

const QUICK_LINKS = [
  { to: '/staff/queue', label: 'Hàng chờ', desc: 'Tiếp nhận và gọi số' },
  { to: '/staff/calendar', label: 'Lịch làm việc', desc: 'Xem lịch theo bác sĩ / chi nhánh' },
  { to: '/staff/patients', label: 'Hồ sơ thú cưng', desc: 'Tìm kiếm hồ sơ bệnh nhân' },
  { to: '/staff/appointments', label: 'Lịch hẹn', desc: 'Danh sách & chi tiết lịch hẹn' },
];

/** Vai trò không có `REPORT_VIEW` vẫn cần một trang chủ dùng được (BR-15). */
function QuickLinksOnly({ name }: { name?: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Tổng quan</h1>
        <p className="text-muted">Xin chào, {name}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded border border-border bg-surface p-4 hover:bg-surface-muted"
          >
            <p className="font-medium">{link.label}</p>
            <p className="text-sm text-muted">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
