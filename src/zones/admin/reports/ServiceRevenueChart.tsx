import { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle, Skeleton, cn } from '@/components/basic';
import { formatCurrency } from '@/utils/format';

export interface ServiceRevenueItem {
  serviceName: string;
  totalRevenue: number;
  count: number;
}

export interface ServiceRevenueChartProps {
  data: ServiceRevenueItem[];
  loading?: boolean;
}

export function ServiceRevenueChart({ data, loading }: ServiceRevenueChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [limit, setLimit] = useState<number>(8);

  const { totalRevenue, totalCount, maxRevenue, sortedServices } = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalRevenue: 0, totalCount: 0, maxRevenue: 1, sortedServices: [] };
    }
    const sorted = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const rev = sorted.reduce((sum, item) => sum + item.totalRevenue, 0);
    const count = sorted.reduce((sum, item) => sum + item.count, 0);
    const max = Math.max(...sorted.map((item) => item.totalRevenue), 1);
    return {
      totalRevenue: rev,
      totalCount: count,
      maxRevenue: max,
      sortedServices: sorted,
    };
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardBody className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </CardBody>
      </Card>
    );
  }

  const displayedServices = limit === 0 ? sortedServices : sortedServices.slice(0, limit);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            <CardTitle as="h2" className="text-lg font-semibold text-foreground">
              Doanh thu theo dịch vụ
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-muted">
            Phân bổ doanh thu theo từng loại dịch vụ khám, chữa và xét nghiệm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border bg-surface-muted/60 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium transition-all',
                viewMode === 'chart'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-muted hover:text-foreground',
              )}
            >
              Biểu đồ
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium transition-all',
                viewMode === 'table'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-muted hover:text-foreground',
              )}
            >
              Bảng chi tiết
            </button>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        {/* Quick summary header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-muted/50 px-4 py-2 text-xs">
          <div>
            <span className="text-muted">Tổng dịch vụ ghi nhận: </span>
            <strong className="font-semibold text-foreground">{sortedServices.length} loại</strong>
          </div>
          <div>
            <span className="text-muted">Tổng số lượt thực hiện: </span>
            <strong className="font-semibold text-foreground">{totalCount.toLocaleString('vi-VN')} lượt</strong>
          </div>
          <div>
            <span className="text-muted">Doanh thu dịch vụ: </span>
            <strong className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalRevenue)}
            </strong>
          </div>
        </div>

        {sortedServices.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
            Không có dữ liệu dịch vụ trong kỳ.
          </div>
        ) : viewMode === 'chart' ? (
          <div className="space-y-3.5">
            {displayedServices.map((service, index) => {
              const percentage = maxRevenue > 0 ? (service.totalRevenue / maxRevenue) * 100 : 0;
              const shareOfTotal = totalRevenue > 0 ? (service.totalRevenue / totalRevenue) * 100 : 0;
              const avgPerSession = service.count > 0 ? service.totalRevenue / service.count : 0;

              return (
                <div
                  key={service.serviceName}
                  className="group rounded-xl border border-border/60 bg-surface p-3 transition-all hover:border-primary/40 hover:bg-surface-muted/30"
                >
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          index === 0
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : index === 1
                              ? 'bg-slate-400/20 text-slate-700 dark:text-slate-300'
                              : index === 2
                                ? 'bg-amber-700/15 text-amber-700 dark:text-amber-500'
                                : 'bg-surface-muted text-muted',
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground" title={service.serviceName}>
                          {service.serviceName}
                        </p>
                        <p className="text-[11px] text-muted">
                          {service.count.toLocaleString('vi-VN')} lượt · TB {formatCurrency(Math.round(avgPerSession))}/lượt
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground [font-variant-numeric:tabular-nums]">
                        {formatCurrency(service.totalRevenue)}
                      </p>
                      <p className="text-[11px] text-muted">
                        Chiếm {shareOfTotal.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        index === 0
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : index === 1
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                            : 'bg-emerald-500/70',
                      )}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {sortedServices.length > 8 && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setLimit(limit === 8 ? 0 : 8)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {limit === 8 ? `Xem tất cả ${sortedServices.length} dịch vụ` : 'Thu gọn (Top 8)'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-surface-muted text-left text-xs font-semibold text-muted">
                <tr>
                  <th className="px-4 py-2.5">Thứ hạng</th>
                  <th className="px-4 py-2.5">Tên dịch vụ</th>
                  <th className="px-4 py-2.5 text-right">Số lượt</th>
                  <th className="px-4 py-2.5 text-right">Doanh thu</th>
                  <th className="px-4 py-2.5 text-right">TB / Lượt</th>
                  <th className="px-4 py-2.5 text-right">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedServices.map((service, index) => {
                  const shareOfTotal = totalRevenue > 0 ? (service.totalRevenue / totalRevenue) * 100 : 0;
                  const avg = service.count > 0 ? service.totalRevenue / service.count : 0;
                  return (
                    <tr key={service.serviceName} className="hover:bg-surface-muted/50">
                      <td className="px-4 py-2.5 text-muted">#{index + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{service.serviceName}</td>
                      <td className="px-4 py-2.5 text-right [font-variant-numeric:tabular-nums]">
                        {service.count.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 [font-variant-numeric:tabular-nums]">
                        {formatCurrency(service.totalRevenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted [font-variant-numeric:tabular-nums]">
                        {formatCurrency(Math.round(avg))}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted [font-variant-numeric:tabular-nums]">
                        {shareOfTotal.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
