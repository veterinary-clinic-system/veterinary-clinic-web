import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { DashboardKpi, DashboardSeries, reportsApi } from '@/api/reports.api';
import {
  Alert,
  Icon,
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

/**
 * KPI mà TĂNG là XẤU. Delta của chúng phải đổi màu ngược lại - một mũi tên xanh trên
 * "Thuốc sắp hết +40%" là đọc sai hẳn tình hình.
 */
const LOWER_IS_BETTER = new Set(['lowStockProducts', 'lowStockMedicines', 'waitingPatients']);

/**
 * Gom biểu đồ thành ba nhóm, mỗi nhóm trả lời MỘT câu hỏi kinh doanh.
 *
 * Trước đây tám biểu đồ đổ thành một lưới phẳng, và một lưới tám biểu đồ thì không ai
 * đọc - người xem lướt qua rồi quay lại làm việc khác. Đặt nhóm có tiêu đề dạng câu hỏi
 * buộc mỗi biểu đồ phải thuộc về một câu hỏi nào đó; biểu đồ không thuộc nhóm nào rơi
 * vào "Khác", và đó là tín hiệu nên bỏ nó đi.
 */
const CHART_GROUPS: { question: string; keys: string[] }[] = [
  {
    question: 'Doanh thu đang đi theo hướng nào?',
    keys: ['revenueByDay', 'revenueByMonth'],
  },
  {
    question: 'Phòng khám phục vụ được bao nhiêu ca, và có thêm khách mới không?',
    keys: ['examsByDay', 'newCustomersByDay', 'newPetsByDay'],
  },
  {
    question: 'Bán chạy nhất là gì - nên nhập thêm thứ nào?',
    keys: ['topProducts', 'topMedicines', 'topServices'],
  },
];

/**
 * Trang tổng quan ĐIỀU HÀNH - SRS FR-24 (P10-T3).
 *
 * MỘT REQUEST cho cả 8 thẻ KPI và 8 biểu đồ (`GET /reports/dashboard`, cache Redis 60s).
 * Mở trang mà bắn 16 request song song thì vừa chậm vừa cho ra một trang có 16 trạng
 * thái tải khác nhau, nhấp nháy lệch nhau.
 *
 * BR-15: trang này dẫn đầu bằng doanh thu nên nó nằm sau `REPORT_VIEW` - trong ma trận
 * mặc định chỉ ADMIN và MANAGER có quyền đó.
 *
 * Bác sĩ và lễ tân KHÔNG còn rơi vào đây: `/staff` của họ là bảng công việc hôm nay
 * (xem `src/app/StaffHomePage.tsx`). Trước đây họ nhận một trang chỉ gồm bốn ô liên kết
 * - đúng nghĩa một ngõ cụt cho hai vai trò dùng hệ thống nhiều nhất.
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
        title="Tổng quan"
        description={
          data ? `Số liệu cập nhật lúc ${formatTime(data.generatedAt)}` : 'Đang lấy số liệu điều hành...'
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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {dashboardQuery.isLoading
            ? Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-[6.5rem] rounded-xl" />
              ))
            : (data?.kpis ?? []).map((kpi) => <KpiTile key={kpi.key} kpi={kpi} />)}
        </div>
      </section>

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

/**
 * Thẻ KPI: nhãn, giá trị, thay đổi so với hôm qua.
 *
 * Cả thẻ là một liên kết - người xem thấy "Đang chờ khám: 7" thì việc tiếp theo họ muốn
 * làm là mở trang Hàng chờ, không phải đi tìm nó ở thanh bên.
 */
function KpiTile({ kpi }: { kpi: DashboardKpi }) {
  return (
    <StatTile
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

/**
 * Câu mô tả thay đổi so với hôm qua.
 *
 * `deltaRatio` null nghĩa là KHÔNG SO SÁNH ĐƯỢC (hôm qua bằng 0, hoặc chỉ số không có
 * khái niệm "hôm qua" như số đang chờ khám) - khi đó không nói gì. Vẽ "+100%" cho một
 * phép chia cho 0 là bịa ra một tin tốt.
 *
 * Hướng thay đổi viết bằng CHỮ ("tăng"/"giảm") chứ không chỉ bằng mũi tên và màu: với
 * `lowStockMedicines`, "tăng" là tin xấu, và không có bảng màu nào truyền đạt được điều
 * đó chỉ bằng sắc độ.
 */
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

const QUICK_LINKS = [
  { to: '/staff/queue', label: 'Hàng chờ', desc: 'Tiếp nhận và gọi số' },
  { to: '/staff/pos', label: 'Bán hàng tại quầy', desc: 'Lập hoá đơn bán lẻ' },
  { to: '/staff/inventory', label: 'Tồn kho', desc: 'Tra cứu số lượng và lô hàng' },
  { to: '/staff/billing', label: 'Hoá đơn', desc: 'Danh sách và thanh toán' },
];

/**
 * Vai trò không có `REPORT_VIEW` (dược sĩ, nhân viên bán hàng) vẫn cần một trang chủ
 * dùng được - BR-15. Nói rõ vì sao không thấy số liệu thay vì để trang trống.
 */
function NoReportAccess() {
  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        title="Tổng quan"
        description="Bắt đầu ngày làm việc từ một trong các màn hình dưới đây."
      />

      <Alert tone="info" title="Số liệu doanh thu chỉ dành cho quản lý">
        Tài khoản của bạn không được cấp quyền xem báo cáo doanh thu, nên trang này hiển thị lối tắt
        tới các màn hình bạn dùng hằng ngày.
      </Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-card transition-colors hover:border-primary/40 hover:bg-primary-soft"
          >
            <span>
              <span className="block font-medium text-foreground">{link.label}</span>
              <span className="block text-sm text-muted">{link.desc}</span>
            </span>
            <Icon name="arrow-right" className="mt-0.5 h-4 w-4 text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
