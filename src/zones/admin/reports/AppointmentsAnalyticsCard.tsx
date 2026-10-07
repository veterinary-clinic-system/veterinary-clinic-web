import { ExamSummaryReport } from '@/api/reports.api';
import { Avatar, Card, CardBody, CardHeader, CardTitle, Skeleton, cn } from '@/components/basic';

export interface AppointmentsAnalyticsCardProps {
  data?: ExamSummaryReport;
  loading?: boolean;
}

export function AppointmentsAnalyticsCard({ data, loading }: AppointmentsAnalyticsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardBody className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </CardBody>
      </Card>
    );
  }

  if (!data) return null;

  const total = data.totalAppointments || 0;
  const completedRate = total > 0 ? (data.completed / total) * 100 : 0;
  const noShowRate = total > 0 ? (data.noShow / total) * 100 : 0;
  const cancelledRate = total > 0 ? (data.cancelled / total) * 100 : 0;

  // Max workload among veterinarians
  const maxExams = Math.max(...(data.topVeterinarians ?? []).map((v) => v.examCount), 1);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <CardTitle as="h2" className="text-lg font-semibold text-foreground">
              Báo cáo khám & Lịch hẹn
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-muted">
            Kết quả các lịch hẹn đã đến hạn và phân bổ công việc của các bác sĩ.
          </p>
        </div>

        {/* No-show rate badge */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted/60 px-3 py-1.5">
          <span className="text-xs text-muted">Tỉ lệ vắng mặt:</span>
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-xs font-bold [font-variant-numeric:tabular-nums]',
              data.noShowRate > 0.15
                ? 'bg-danger/15 text-danger'
                : data.noShowRate > 0.08
                  ? 'bg-warning/15 text-warning'
                  : 'bg-success/15 text-success',
            )}
          >
            {Math.round(data.noShowRate * 100)}%
          </span>
          <span className="text-[11px] text-muted">
            {data.noShowRate > 0.15 ? '(Cần nhắc lịch)' : data.noShowRate > 0.08 ? '(Trung bình)' : '(Tốt)'}
          </span>
        </div>
      </CardHeader>

      <CardBody className="space-y-6 pt-2">
        {/* Metric tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-surface-muted/30 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Tổng lịch hẹn</span>
            <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl [font-variant-numeric:tabular-nums]">
              {total.toLocaleString('vi-VN')}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Đã khám xong
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-2xl [font-variant-numeric:tabular-nums]">
              {data.completed.toLocaleString('vi-VN')}
            </p>
            <span className="text-[11px] text-muted">{completedRate.toFixed(1)}% tổng lịch</span>
          </div>

          <div className="rounded-xl border border-border/70 bg-amber-500/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Khách vắng mặt
              </span>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400 sm:text-2xl [font-variant-numeric:tabular-nums]">
              {data.noShow.toLocaleString('vi-VN')}
            </p>
            <span className="text-[11px] text-muted">{noShowRate.toFixed(1)}% tổng lịch</span>
          </div>

          <div className="rounded-xl border border-border/70 bg-rose-500/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Đã hủy
              </span>
              <span className="h-2 w-2 rounded-full bg-rose-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400 sm:text-2xl [font-variant-numeric:tabular-nums]">
              {data.cancelled.toLocaleString('vi-VN')}
            </p>
            <span className="text-[11px] text-muted">{cancelledRate.toFixed(1)}% tổng lịch</span>
          </div>
        </div>

        {/* Visual Segmented Progress Bar */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span className="font-medium text-foreground">Cơ cấu trạng thái lịch hẹn</span>
            <span>{total} lịch hẹn</span>
          </div>

          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-surface-muted shadow-inner">
            {completedRate > 0 && (
              <div
                className="bg-emerald-500 transition-all duration-500 hover:opacity-90"
                style={{ width: `${completedRate}%` }}
                title={`Đã khám xong: ${data.completed} (${completedRate.toFixed(1)}%)`}
              />
            )}
            {noShowRate > 0 && (
              <div
                className="bg-amber-500 transition-all duration-500 hover:opacity-90"
                style={{ width: `${noShowRate}%` }}
                title={`Vắng mặt: ${data.noShow} (${noShowRate.toFixed(1)}%)`}
              />
            )}
            {cancelledRate > 0 && (
              <div
                className="bg-rose-500 transition-all duration-500 hover:opacity-90"
                style={{ width: `${cancelledRate}%` }}
                title={`Đã hủy: ${data.cancelled} (${cancelledRate.toFixed(1)}%)`}
              />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Đã khám xong ({data.completed})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>Vắng mặt ({data.noShow})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span>Đã hủy ({data.cancelled})</span>
            </div>
          </div>
        </div>

        {/* Top Veterinarians Workload */}
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Khối lượng ca khám theo Bác sĩ
          </h3>

          {(data.topVeterinarians ?? []).length === 0 ? (
            <p className="text-sm text-muted">Không có ca khám nào của bác sĩ trong kỳ.</p>
          ) : (
            <div className="space-y-3">
              {data.topVeterinarians.map((vet, idx) => {
                const workloadPercent = maxExams > 0 ? (vet.examCount / maxExams) * 100 : 0;
                return (
                  <div
                    key={vet.doctorId || vet.doctorName}
                    className="rounded-xl border border-border/60 bg-surface p-3 transition-colors hover:bg-surface-muted/30"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[11px] font-bold text-muted">
                          {idx + 1}
                        </span>
                        <Avatar name={vet.doctorName} size="sm" />
                        <span className="truncate font-medium text-foreground">{vet.doctorName}</span>
                      </div>

                      <div className="flex items-center gap-3 text-right text-xs shrink-0 [font-variant-numeric:tabular-nums]">
                        <span className="font-semibold text-foreground">
                          {vet.examCount} <span className="font-normal text-muted">lượt khám</span>
                        </span>
                        {vet.noShowCount > 0 && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
                            {vet.noShowCount} vắng
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.max(workloadPercent, 3)}%` }}
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
