import { InventoryReport } from '@/api/reports.api';
import { Card, CardBody, CardHeader, CardTitle, Skeleton, cn } from '@/components/basic';

export interface InventoryHealthCardProps {
  data?: InventoryReport;
  loading?: boolean;
}

export function InventoryHealthCard({ data, loading }: InventoryHealthCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!data) return null;

  const totalCatalog = data.totalProducts + data.totalMedicines + data.totalVaccines;
  const totalIssues = data.lowStock + data.outOfStock + data.expiringSoon + data.expired;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <CardTitle as="h2" className="text-lg font-semibold text-foreground">
              Báo cáo an toàn kho & Hạn dùng
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-muted">
            Ảnh chụp tại thời điểm hiện tại. Cảnh báo hạn dùng tính trong {data.expiringSoonDays} ngày tới.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalIssues === 0 ? (
            <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Kho hàng an toàn
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
              <span className="h-2 w-2 rounded-full bg-warning" />
              {totalIssues} mục cần chú ý
            </span>
          )}
        </div>
      </CardHeader>

      <CardBody className="space-y-6 pt-2">
        {/* Catalog Categories */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Quy mô danh mục quản lý ({totalCatalog.toLocaleString('vi-VN')} mặt hàng)
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-muted/30 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                SP
              </span>
              <div>
                <p className="text-xs text-muted">Sản phẩm bán lẻ</p>
                <p className="text-lg font-bold text-foreground [font-variant-numeric:tabular-nums]">
                  {data.totalProducts.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-muted/30 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                TH
              </span>
              <div>
                <p className="text-xs text-muted">Thuốc điều trị</p>
                <p className="text-lg font-bold text-foreground [font-variant-numeric:tabular-nums]">
                  {data.totalMedicines.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-muted/30 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold">
                VX
              </span>
              <div>
                <p className="text-xs text-muted">Vắc-xin phòng ngừa</p>
                <p className="text-lg font-bold text-foreground [font-variant-numeric:tabular-nums]">
                  {data.totalVaccines.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock & Expiry Alerts */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Tình trạng tồn kho & Hạn sử dụng
          </h3>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Low stock */}
            <div className={cn(
              'rounded-xl border p-3.5 transition-colors',
              data.lowStock > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-surface',
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Sắp hết hàng</span>
                <span className={cn('h-2 w-2 rounded-full', data.lowStock > 0 ? 'bg-amber-500' : 'bg-muted/40')} />
              </div>
              <p className={cn(
                'mt-2 text-2xl font-bold [font-variant-numeric:tabular-nums]',
                data.lowStock > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted',
              )}>
                {data.lowStock}
              </p>
              <p className="mt-1 text-[11px] text-muted">Dưới định mức tối thiểu</p>
            </div>

            {/* Out of stock */}
            <div className={cn(
              'rounded-xl border p-3.5 transition-colors',
              data.outOfStock > 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-border bg-surface',
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Hết hàng</span>
                <span className={cn('h-2 w-2 rounded-full', data.outOfStock > 0 ? 'bg-rose-500' : 'bg-muted/40')} />
              </div>
              <p className={cn(
                'mt-2 text-2xl font-bold [font-variant-numeric:tabular-nums]',
                data.outOfStock > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted',
              )}>
                {data.outOfStock}
              </p>
              <p className="mt-1 text-[11px] text-muted">Tồn khả dụng = 0</p>
            </div>

            {/* Expiring soon */}
            <div className={cn(
              'rounded-xl border p-3.5 transition-colors',
              data.expiringSoon > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-surface',
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Sắp hết hạn</span>
                <span className={cn('h-2 w-2 rounded-full', data.expiringSoon > 0 ? 'bg-amber-500' : 'bg-muted/40')} />
              </div>
              <p className={cn(
                'mt-2 text-2xl font-bold [font-variant-numeric:tabular-nums]',
                data.expiringSoon > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted',
              )}>
                {data.expiringSoon}
              </p>
              <p className="mt-1 text-[11px] text-muted">Trong {data.expiringSoonDays} ngày tới</p>
            </div>

            {/* Expired */}
            <div className={cn(
              'rounded-xl border p-3.5 transition-colors',
              data.expired > 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-border bg-surface',
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Đã hết hạn</span>
                <span className={cn('h-2 w-2 rounded-full', data.expired > 0 ? 'bg-rose-500' : 'bg-muted/40')} />
              </div>
              <p className={cn(
                'mt-2 text-2xl font-bold [font-variant-numeric:tabular-nums]',
                data.expired > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted',
              )}>
                {data.expired}
              </p>
              <p className="mt-1 text-[11px] text-muted">Cần tiêu hủy/xuất trả</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
