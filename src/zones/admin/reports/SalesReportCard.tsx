import { useMemo, useState } from 'react';
import { SalesReportRow } from '@/api/reports.api';
import { Button, Card, CardBody, CardHeader, CardTitle, Input, Skeleton, cn } from '@/components/basic';
import { formatCurrency } from '@/utils/format';

export interface SalesReportCardProps {
  data: SalesReportRow[];
  loading?: boolean;
  exporting?: boolean;
  onExport: () => void;
}

export function SalesReportCard({ data, loading, exporting, onExport }: SalesReportCardProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'ranking' | 'table'>('ranking');

  const { totalRevenue, totalQuantitySold, maxQuantity, topSelling, filteredRows } = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalRevenue: 0, totalQuantitySold: 0, maxQuantity: 1, topSelling: [], filteredRows: [] };
    }

    const rev = data.reduce((acc, cur) => acc + (cur.totalRevenue || 0), 0);
    const qty = data.reduce((acc, cur) => acc + (cur.quantitySold || 0), 0);
    const top = [...data].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);
    const maxQ = Math.max(...top.map((i) => i.quantitySold), 1);

    const filtered = search.trim()
      ? data.filter(
          (row) =>
            row.itemName.toLowerCase().includes(search.toLowerCase()) ||
            row.itemCode.toLowerCase().includes(search.toLowerCase()),
        )
      : data;

    return {
      totalRevenue: rev,
      totalQuantitySold: qty,
      maxQuantity: maxQ,
      topSelling: top,
      filteredRows: filtered,
    };
  }, [data, search]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardBody className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </span>
            <CardTitle as="h2" className="text-lg font-semibold text-foreground">
              Báo cáo bán hàng & Sản phẩm
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-muted">
            Mặt hàng bán chạy nhất tại quầy và nhà thuốc trong kỳ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border bg-surface-muted/60 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('ranking')}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium transition-all',
                viewMode === 'ranking'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-muted hover:text-foreground',
              )}
            >
              Top nổi bật
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
              Tất cả mặt hàng
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            loading={exporting}
            onClick={onExport}
            className="text-xs"
          >
            <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Xuất CSV
          </Button>
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        {/* Quick metrics */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Tổng số lượng bán</span>
            <p className="mt-1 text-base font-bold text-foreground sm:text-lg [font-variant-numeric:tabular-nums]">
              {totalQuantitySold.toLocaleString('vi-VN')} <span className="text-xs font-normal text-muted">sản phẩm</span>
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Tổng doanh thu bán hàng</span>
            <p className="mt-1 text-base font-bold text-amber-600 dark:text-amber-400 sm:text-lg [font-variant-numeric:tabular-nums]">
              {formatCurrency(totalRevenue)}
            </p>
          </div>

          <div className="col-span-2 rounded-xl border border-border/70 bg-surface-muted/40 p-3 sm:col-span-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Mặt hàng phát sinh</span>
            <p className="mt-1 text-base font-bold text-foreground sm:text-lg [font-variant-numeric:tabular-nums]">
              {(data ?? []).length} <span className="text-xs font-normal text-muted">mã hàng</span>
            </p>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
            Không có giao dịch bán hàng nào trong kỳ.
          </div>
        ) : viewMode === 'ranking' ? (
          /* Visual top selling */
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Top 5 sản phẩm bán chạy nhất theo số lượng
            </h3>

            <div className="space-y-3">
              {topSelling.map((item, idx) => {
                const percentage = maxQuantity > 0 ? (item.quantitySold / maxQuantity) * 100 : 0;
                return (
                  <div
                    key={item.itemCode}
                    className="rounded-xl border border-border/60 bg-surface p-3 transition-colors hover:bg-surface-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            idx === 0
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : idx === 1
                                ? 'bg-slate-400/20 text-slate-700 dark:text-slate-300'
                                : idx === 2
                                  ? 'bg-amber-700/15 text-amber-700 dark:text-amber-500'
                                  : 'bg-surface-muted text-muted',
                          )}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{item.itemName}</p>
                          <span className="font-mono text-xs text-muted">{item.itemCode}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 [font-variant-numeric:tabular-nums]">
                        <p className="font-bold text-foreground">
                          {item.quantitySold.toLocaleString('vi-VN')} <span className="text-xs font-normal text-muted">đã bán</span>
                        </p>
                        <p className="text-xs font-semibold text-primary">
                          {formatCurrency(item.totalRevenue)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Detailed table view with search */
          <div className="space-y-3">
            <div className="max-w-xs">
              <Input
                placeholder="Tìm theo mã hoặc tên sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="max-h-96 overflow-y-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-surface-muted text-left text-xs font-semibold text-muted">
                  <tr>
                    <th className="px-4 py-2.5">Mã hàng</th>
                    <th className="px-4 py-2.5">Tên sản phẩm</th>
                    <th className="px-4 py-2.5 text-right">Số lượng bán</th>
                    <th className="px-4 py-2.5 text-right">Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted">
                        Không tìm thấy mặt hàng nào phù hợp với tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={row.itemCode} className="hover:bg-surface-muted/50">
                        <td className="px-4 py-2.5 font-mono text-xs text-muted">{row.itemCode}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground">{row.itemName}</td>
                        <td className="px-4 py-2.5 text-right [font-variant-numeric:tabular-nums]">
                          {row.quantitySold.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-foreground [font-variant-numeric:tabular-nums]">
                          {formatCurrency(row.totalRevenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
