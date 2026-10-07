import { AiAccuracyReport } from '@/api/reports.api';
import { Card, CardBody, CardHeader, CardTitle, Skeleton, cn } from '@/components/basic';
import { PRIORITY_COLOR_LABEL_VI, PriorityColor } from '@/types/enums';

export interface AiAccuracyReportCardProps {
  data?: AiAccuracyReport;
  loading?: boolean;
}

const COLOR_MAP: Record<string, { bg: string; text: string; bar: string }> = {
  RED: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' },
  ORANGE: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  YELLOW: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  GREEN: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  BLUE: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
};

export function AiAccuracyReportCard({ data, loading }: AiAccuracyReportCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardBody className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </CardBody>
      </Card>
    );
  }

  if (!data) return null;

  const acceptancePercentage = Math.round((data.acceptanceRate || 0) * 100);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <CardTitle as="h2" className="text-lg font-semibold text-foreground">
              Mức độ đồng thuận với phân loại AI
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-muted">
            Tỉ lệ nhân viên giữ nguyên mức ưu tiên do AI đề xuất (không ghi đè thủ công).
          </p>
        </div>

        {/* Global accuracy badge */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted/60 px-3 py-1.5">
          <span className="text-xs text-muted">Độ đồng thuận chung:</span>
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-xs font-bold [font-variant-numeric:tabular-nums]',
              acceptancePercentage >= 80
                ? 'bg-success/15 text-success'
                : acceptancePercentage >= 60
                  ? 'bg-warning/15 text-warning'
                  : 'bg-danger/15 text-danger',
            )}
          >
            {acceptancePercentage}%
          </span>
        </div>
      </CardHeader>

      <CardBody className="space-y-6 pt-2">
        {/* Metric summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Tổng ca đánh giá</span>
            <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl [font-variant-numeric:tabular-nums]">
              {data.totalEvaluated.toLocaleString('vi-VN')}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-emerald-500/5 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Chấp nhận gợi ý AI
            </span>
            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-2xl [font-variant-numeric:tabular-nums]">
              {data.accepted.toLocaleString('vi-VN')}
            </p>
            <span className="text-[11px] text-muted">
              {data.totalEvaluated > 0 ? Math.round((data.accepted / data.totalEvaluated) * 100) : 0}% tổng ca
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-amber-500/5 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Nhân viên ghi đè
            </span>
            <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400 sm:text-2xl [font-variant-numeric:tabular-nums]">
              {data.overridden.toLocaleString('vi-VN')}
            </p>
            <span className="text-[11px] text-muted">
              {data.totalEvaluated > 0 ? Math.round((data.overridden / data.totalEvaluated) * 100) : 0}% tổng ca
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Hiệu quả phân loại</span>
            <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl [font-variant-numeric:tabular-nums]">
              {acceptancePercentage}%
            </p>
            <span className="text-[11px] text-muted">
              {acceptancePercentage >= 80 ? 'Hoạt động rất tốt' : 'Cần theo dõi thêm'}
            </span>
          </div>
        </div>

        {/* Breakdown by priority level */}
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Phân tích theo từng mức độ ưu tiên cấp cứu
          </h3>

          {data.breakdownByColor.length === 0 ? (
            <p className="text-sm text-muted">Không có dữ liệu phân loại AI trong kỳ.</p>
          ) : (
            <div className="space-y-3">
              {data.breakdownByColor.map((item) => {
                const totalItem = item.acceptedCount + item.overriddenCount;
                const itemAcceptRate = totalItem > 0 ? Math.round((item.acceptedCount / totalItem) * 100) : 0;
                const colors = COLOR_MAP[item.aiPriorityColor] ?? {
                  bg: 'bg-surface-muted',
                  text: 'text-foreground',
                  bar: 'bg-primary',
                };
                const label =
                  PRIORITY_COLOR_LABEL_VI[item.aiPriorityColor as PriorityColor] ?? item.aiPriorityColor;

                return (
                  <div
                    key={item.aiPriorityColor}
                    className="rounded-xl border border-border/60 bg-surface p-3 transition-colors hover:bg-surface-muted/30"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('h-3 w-3 rounded-full shrink-0', colors.bar)} />
                        <span className="font-medium text-foreground">{label}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs [font-variant-numeric:tabular-nums]">
                        <span className="text-muted">
                          Chấp nhận: <strong className="font-semibold text-emerald-600 dark:text-emerald-400">{item.acceptedCount}</strong>
                        </span>
                        <span className="text-muted">
                          Ghi đè: <strong className="font-semibold text-amber-600 dark:text-amber-400">{item.overriddenCount}</strong>
                        </span>
                        <span className="font-bold text-foreground">
                          {itemAcceptRate}% đồng thuận
                        </span>
                      </div>
                    </div>

                    {/* Progress bar showing accepted vs overridden ratio */}
                    <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="bg-emerald-500 transition-all duration-500"
                        style={{ width: `${itemAcceptRate}%` }}
                        title={`Chấp nhận: ${item.acceptedCount} (${itemAcceptRate}%)`}
                      />
                      <div
                        className="bg-amber-500 transition-all duration-500"
                        style={{ width: `${100 - itemAcceptRate}%` }}
                        title={`Ghi đè: ${item.overriddenCount} (${100 - itemAcceptRate}%)`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
