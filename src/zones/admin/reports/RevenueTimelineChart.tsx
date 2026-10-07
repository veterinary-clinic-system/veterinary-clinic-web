import { useId, useMemo, useState } from 'react';
import { RevenuePoint } from '@/api/reports.api';
import { Card, CardBody, CardHeader, CardTitle, Skeleton, cn } from '@/components/basic';
import { compactNumber } from '@/components/charts/chart-utils';
import { formatCurrency } from '@/utils/format';

export interface RevenueTimelineChartProps {
  data: RevenuePoint[];
  loading?: boolean;
  groupBy: 'day' | 'month';
}

type ViewMode = 'line' | 'bar' | 'table';

export function RevenueTimelineChart({ data, loading, groupBy }: RevenueTimelineChartProps) {
  const [mode, setMode] = useState<ViewMode>('line');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const titleId = useId();

  // Metrics summary
  const { totalRevenue, totalInvoices, avgRevenue, peakPoint } = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalRevenue: 0, totalInvoices: 0, avgRevenue: 0, peakPoint: null };
    }
    const totalRev = data.reduce((acc, cur) => acc + (cur.totalRevenue || 0), 0);
    const totalInv = data.reduce((acc, cur) => acc + (cur.invoiceCount || 0), 0);
    const avgRev = Math.round(totalRev / data.length);
    const peak = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue)[0] ?? null;

    return {
      totalRevenue: totalRev,
      totalInvoices: totalInv,
      avgRevenue: avgRev,
      peakPoint: peak,
    };
  }, [data]);

  // Chart coordinate calculations
  const chartMetrics = useMemo(() => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map((d) => d.totalRevenue), 1);
    // Ceiling round
    const magnitude = 10 ** Math.floor(Math.log10(max));
    const normalized = max / magnitude;
    const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    const ceiling = Math.max(step * magnitude, 100_000);

    const ticks = [0, ceiling * 0.25, ceiling * 0.5, ceiling * 0.75, ceiling];

    return { max, ceiling, ticks };
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardBody>
      </Card>
    );
  }

  const isEmpty = !data || data.length === 0;
  const activeIndex = hoverIndex !== null ? hoverIndex : data.length - 1;
  const activeItem = !isEmpty && activeIndex >= 0 ? data[activeIndex] : null;

  // SVG dimensions
  const SVG_WIDTH = 760;
  const SVG_HEIGHT = 260;
  const PADDING = { top: 28, right: 32, bottom: 40, left: 75 };
  const PLOT_WIDTH = SVG_WIDTH - PADDING.left - PADDING.right;
  const PLOT_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;

  const points = (data ?? []).map((item, index) => {
    const ceiling = chartMetrics?.ceiling ?? 1;
    const stepX = data.length > 1 ? PLOT_WIDTH / (data.length - 1) : PLOT_WIDTH / 2;
    const x = PADDING.left + (data.length > 1 ? stepX * index : PLOT_WIDTH / 2);
    const y = PADDING.top + PLOT_HEIGHT - (Math.max(item.totalRevenue, 0) / ceiling) * PLOT_HEIGHT;
    return { x, y, ...item };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(PADDING.top + PLOT_HEIGHT).toFixed(1)} L ${points[0].x.toFixed(1)} ${(PADDING.top + PLOT_HEIGHT).toFixed(1)} Z`
      : '';

  const labelFrequency = Math.max(1, Math.ceil(data.length / 8));

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
            <CardTitle id={titleId} as="h2" className="text-lg font-semibold text-foreground">
              Tiền thực thu theo thời gian
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-muted">
            Tổng giá trị thanh toán thực tế trừ tiền hoàn trả theo {groupBy === 'day' ? 'ngày' : 'tháng'}.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center rounded-lg border border-border bg-surface-muted/60 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('line')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all',
              mode === 'line'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-muted hover:text-foreground',
            )}
            title="Biểu đồ đường xu hướng"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Đường
          </button>
          <button
            type="button"
            onClick={() => setMode('bar')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all',
              mode === 'bar'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-muted hover:text-foreground',
            )}
            title="Biểu đồ cột"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Cột
          </button>
          <button
            type="button"
            onClick={() => setMode('table')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all',
              mode === 'table'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-muted hover:text-foreground',
            )}
            title="Bảng số liệu chi tiết"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Bảng
          </button>
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        {/* Quick summary metrics */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-3 transition-colors hover:bg-surface-muted/80">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Tổng kỳ này</span>
            <p className="mt-1 text-base font-bold text-foreground sm:text-lg [font-variant-numeric:tabular-nums]">
              {formatCurrency(totalRevenue)}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-3 transition-colors hover:bg-surface-muted/80">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Trung bình/{groupBy === 'day' ? 'ngày' : 'tháng'}</span>
            <p className="mt-1 text-base font-bold text-foreground sm:text-lg [font-variant-numeric:tabular-nums]">
              {formatCurrency(avgRevenue)}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-3 transition-colors hover:bg-surface-muted/80">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Đỉnh doanh thu</span>
            <p className="mt-1 text-base font-bold text-success sm:text-lg [font-variant-numeric:tabular-nums]">
              {peakPoint ? formatCurrency(peakPoint.totalRevenue) : '0 ₫'}
            </p>
            {peakPoint && <span className="text-[11px] text-muted">({peakPoint.period})</span>}
          </div>

          <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-3 transition-colors hover:bg-surface-muted/80">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Tổng hóa đơn</span>
            <p className="mt-1 text-base font-bold text-foreground sm:text-lg [font-variant-numeric:tabular-nums]">
              {totalInvoices.toLocaleString('vi-VN')} <span className="text-xs font-normal text-muted">hóa đơn</span>
            </p>
          </div>
        </div>

        {isEmpty ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted">
            <svg className="mb-2 h-10 w-10 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Không có dữ liệu doanh thu trong khoảng thời gian đã chọn.
          </div>
        ) : mode === 'line' ? (
          /* SVG Line / Area Trend Chart */
          <div className="relative">
            {/* Tooltip bar on top */}
            {activeItem && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-muted/70 px-3 py-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  <span className="font-semibold text-foreground">{activeItem.period}</span>
                  {hoverIndex === null && <span className="text-muted">(Mốc mới nhất)</span>}
                </div>
                <div className="flex items-center gap-4 [font-variant-numeric:tabular-nums]">
                  <span>
                    Doanh thu: <strong className="font-semibold text-primary">{formatCurrency(activeItem.totalRevenue)}</strong>
                  </span>
                  <span>
                    Hóa đơn: <strong className="font-semibold text-foreground">{activeItem.invoiceCount}</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full min-w-[620px]"
                role="img"
                aria-labelledby={titleId}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis horizontal gridlines */}
                {chartMetrics?.ticks.map((tick) => {
                  const y = PADDING.top + PLOT_HEIGHT - (tick / chartMetrics.ceiling) * PLOT_HEIGHT;
                  return (
                    <g key={tick}>
                      <line
                        x1={PADDING.left}
                        x2={SVG_WIDTH - PADDING.right}
                        y1={y}
                        y2={y}
                        className="stroke-border/70"
                        strokeDasharray={tick === 0 ? undefined : '3 3'}
                        strokeWidth={1}
                      />
                      <text
                        x={PADDING.left - 10}
                        y={y + 3.5}
                        textAnchor="end"
                        className="fill-muted text-[10px] [font-variant-numeric:tabular-nums]"
                      >
                        {compactNumber(tick)}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area */}
                {areaPath && <path d={areaPath} fill="url(#revenueGradient)" />}

                {/* Line Path */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    className="stroke-primary"
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}

                {/* Active hover vertical crosshair line */}
                {hoverIndex !== null && points[hoverIndex] && (
                  <line
                    x1={points[hoverIndex].x}
                    x2={points[hoverIndex].x}
                    y1={PADDING.top}
                    y2={PADDING.top + PLOT_HEIGHT}
                    className="stroke-primary/50"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                  />
                )}

                {/* Data Points */}
                {points.map((p, index) => {
                  const isHovered = hoverIndex === index;
                  const isPeak = p.totalRevenue === chartMetrics?.max && p.totalRevenue > 0;
                  return (
                    <g key={`pt-${p.period}`}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 5.5 : isPeak ? 4 : 3}
                        className={cn(
                          'transition-all',
                          isHovered
                            ? 'fill-surface stroke-primary'
                            : isPeak
                              ? 'fill-success stroke-surface'
                              : 'fill-primary stroke-surface',
                        )}
                        strokeWidth={2}
                      />
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {points.map((p, index) => {
                  if (index % labelFrequency !== 0 && index !== points.length - 1) return null;
                  return (
                    <text
                      key={`lbl-${p.period}`}
                      x={p.x}
                      y={SVG_HEIGHT - 12}
                      textAnchor="middle"
                      className="fill-muted text-[10px] [font-variant-numeric:tabular-nums]"
                    >
                      {p.period.length > 5 ? p.period.slice(5) : p.period}
                    </text>
                  );
                })}

                {/* Hover detector overlay hitboxes */}
                {points.map((p, index) => {
                  const barWidth = points.length > 1 ? PLOT_WIDTH / points.length : PLOT_WIDTH;
                  return (
                    <rect
                      key={`hit-${p.period}`}
                      x={p.x - barWidth / 2}
                      y={PADDING.top}
                      width={barWidth}
                      height={PLOT_HEIGHT + 20}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverIndex(index)}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        ) : mode === 'bar' ? (
          /* SVG Column / Bar Chart */
          <div className="relative">
            {activeItem && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-muted/70 px-3 py-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  <span className="font-semibold text-foreground">{activeItem.period}</span>
                </div>
                <div className="flex items-center gap-4 [font-variant-numeric:tabular-nums]">
                  <span>
                    Doanh thu: <strong className="font-semibold text-primary">{formatCurrency(activeItem.totalRevenue)}</strong>
                  </span>
                  <span>
                    Hóa đơn: <strong className="font-semibold text-foreground">{activeItem.invoiceCount}</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full min-w-[620px]"
                role="img"
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Y-axis grid */}
                {chartMetrics?.ticks.map((tick) => {
                  const y = PADDING.top + PLOT_HEIGHT - (tick / chartMetrics.ceiling) * PLOT_HEIGHT;
                  return (
                    <g key={tick}>
                      <line
                        x1={PADDING.left}
                        x2={SVG_WIDTH - PADDING.right}
                        y1={y}
                        y2={y}
                        className="stroke-border/70"
                        strokeDasharray={tick === 0 ? undefined : '3 3'}
                        strokeWidth={1}
                      />
                      <text
                        x={PADDING.left - 10}
                        y={y + 3.5}
                        textAnchor="end"
                        className="fill-muted text-[10px] [font-variant-numeric:tabular-nums]"
                      >
                        {compactNumber(tick)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {points.map((p, index) => {
                  const isHovered = hoverIndex === index;
                  const colWidth = Math.max(8, Math.min(32, (PLOT_WIDTH / points.length) * 0.65));
                  const barHeight = Math.max(2, (p.totalRevenue / (chartMetrics?.ceiling ?? 1)) * PLOT_HEIGHT);
                  const barY = PADDING.top + PLOT_HEIGHT - barHeight;

                  return (
                    <g key={`bar-${p.period}`}>
                      <rect
                        x={p.x - colWidth / 2}
                        y={barY}
                        width={colWidth}
                        height={barHeight}
                        rx={3}
                        className={cn(
                          'transition-colors cursor-pointer',
                          isHovered
                            ? 'fill-primary'
                            : p.totalRevenue === chartMetrics?.max
                              ? 'fill-primary/80'
                              : 'fill-primary/45 hover:fill-primary/70',
                        )}
                        onMouseEnter={() => setHoverIndex(index)}
                      />
                      {(index % labelFrequency === 0 || index === points.length - 1) && (
                        <text
                          x={p.x}
                          y={SVG_HEIGHT - 12}
                          textAnchor="middle"
                          className="fill-muted text-[10px] [font-variant-numeric:tabular-nums]"
                        >
                          {p.period.length > 5 ? p.period.slice(5) : p.period}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="max-h-80 overflow-y-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-surface-muted text-left text-xs font-semibold text-muted">
                <tr>
                  <th className="px-4 py-2.5">Thời gian</th>
                  <th className="px-4 py-2.5 text-right">Doanh thu</th>
                  <th className="px-4 py-2.5 text-right">Số hóa đơn</th>
                  <th className="px-4 py-2.5 text-right">TB / Hóa đơn</th>
                  <th className="px-4 py-2.5 text-right">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row) => {
                  const share = totalRevenue > 0 ? (row.totalRevenue / totalRevenue) * 100 : 0;
                  const avgPerInv = row.invoiceCount > 0 ? row.totalRevenue / row.invoiceCount : 0;
                  return (
                    <tr key={row.period} className="transition-colors hover:bg-surface-muted/50">
                      <td className="px-4 py-2.5 font-medium text-foreground">{row.period}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-primary [font-variant-numeric:tabular-nums]">
                        {formatCurrency(row.totalRevenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right [font-variant-numeric:tabular-nums]">
                        {row.invoiceCount.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted [font-variant-numeric:tabular-nums]">
                        {formatCurrency(Math.round(avgPerInv))}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted [font-variant-numeric:tabular-nums]">
                        {share.toFixed(1)}%
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
