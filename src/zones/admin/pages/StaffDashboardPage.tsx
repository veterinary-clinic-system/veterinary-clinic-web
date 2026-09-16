import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { DashboardKpi, DashboardSeries, reportsApi } from '@/api/reports.api';
import {
  Alert,
  PageHeader,
  Select,
  Skeleton,
  StatTile,
  cn,
} from '@/components/basic';
import { compactNumber, formatValue } from '@/components/charts/chart-utils';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/enums';
import { formatTime } from '@/utils/format';
import { DashboardChartCard } from '../dashboard/DashboardChartCard';
import { WorkspaceModules } from '@/layouts/staff/WorkspaceModules';

const LOWER_IS_BETTER = new Set(['lowStockProducts', 'lowStockMedicines', 'waitingPatients']);

const CHART_GROUPS: { question: string; keys: string[] }[] = [
  {
    question: 'Hiệu quả kinh doanh',
    keys: ['revenueByDay', 'revenueByMonth'],
  },
  {
    question: 'Hoạt động khám & khách hàng',
    keys: ['examsByDay', 'newCustomersByDay', 'newPetsByDay'],
  },
  {
    question: 'Sản phẩm & dịch vụ nổi bật',
    keys: ['topProducts', 'topMedicines', 'topServices'],
  },
];

export function StaffDashboardPage() {
  const { user } = useAuth();
  const canViewReports = user?.role === Role.ADMIN || user?.role === Role.MANAGER;

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
    return <NoReportAccess />;
  }

  const data = dashboardQuery.data;
  const charts = data?.charts ?? [];
  const grouped = CHART_GROUPS.map((group) => ({
    question: group.question,
    series: charts.filter((chart) => group.keys.includes(chart.key)),
  })).filter((group) => group.series.length > 0);

  const ungrouped = charts.filter(
    (chart) => !CHART_GROUPS.some((group) => group.keys.includes(chart.key)),
  );

  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        className="staff-welcome"
        title="Tổng quan phòng khám"
        description={
          data ? `Theo dõi hoạt động và bắt đầu công việc. Cập nhật lúc ${formatTime(data.generatedAt)}.` : 'Theo dõi hoạt động và bắt đầu công việc trong ngày.'
        }
        actions={
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
        }
      />

      {dashboardQuery.isError && (
        <Alert tone="danger" title="Không tải được số liệu tổng quan">
          Máy chủ chưa phản hồi. Tải lại trang, hoặc thử lại sau ít phút.
        </Alert>
      )}

      <section aria-label="Chỉ số hôm nay">
        <h2 className="mb-4 text-xl font-semibold">Nhịp hoạt động hôm nay</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardQuery.isLoading
            ? Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-[6.5rem] rounded-xl" />
              ))
            : (data?.kpis ?? []).map((kpi) => <KpiTile key={kpi.key} kpi={kpi} />)}
        </div>
      </section>

      <WorkspaceModules />

      {grouped.map((group) => (
        <section key={group.question} aria-label={group.question}>
          <h2 className="text-base font-semibold text-foreground">{group.question}</h2>
          <div
            className={cn(
              'mt-4 grid grid-cols-1 gap-4',
              group.series.length > 1 && 'xl:grid-cols-2',
            )}
          >
            {group.series.map((series) => (
              <DashboardChartCard key={series.key} series={series} />
            ))}
          </div>
        </section>
      ))}

      {ungrouped.length > 0 && (
        <section aria-label="Số liệu khác">
          <h2 className="text-base font-semibold text-foreground">Số liệu khác</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {ungrouped.map((series: DashboardSeries) => (
              <DashboardChartCard key={series.key} series={series} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KpiTile({ kpi }: { kpi: DashboardKpi }) {
  return (
    <StatTile
      className="staff-kpi"
      label={kpi.label}
      to={kpi.link}
      value={
        <span title={formatValue(kpi.value, kpi.format)}>
          {kpi.format === 'currency' ? compactNumber(kpi.value) : kpi.value.toLocaleString('vi-VN')}
        </span>
      }
      hint={deltaLabel(kpi)}
    />
  );
}

function deltaLabel(kpi: DashboardKpi): string | undefined {
  if (kpi.deltaRatio === null) return undefined;

  const percent = Math.round(kpi.deltaRatio * 100);
  if (percent === 0) return 'Không đổi so với hôm qua';

  const direction = percent > 0 ? 'tăng' : 'giảm';
  const judgement = LOWER_IS_BETTER.has(kpi.key)
    ? percent > 0
      ? ' - cần chú ý'
      : ''
    : '';

  return `${direction} ${Math.abs(percent)}% so với hôm qua${judgement}`;
}

function NoReportAccess() {
  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        className="staff-welcome"
        title="Sẵn sàng cho ngày làm việc"
        description="Bắt đầu ngày làm việc từ một trong các màn hình dưới đây."
      />

      <Alert tone="info" title="Số liệu doanh thu chỉ dành cho quản lý">
        Tài khoản của bạn không được cấp quyền xem báo cáo doanh thu, nên trang này hiển thị lối tắt
        tới các màn hình bạn dùng hằng ngày.
      </Alert>

      <WorkspaceModules />
    </div>
  );
}
