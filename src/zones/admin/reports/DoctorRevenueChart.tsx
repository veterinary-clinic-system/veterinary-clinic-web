import { useMemo, useState } from 'react';
import { Avatar, Card, CardBody, CardHeader, CardTitle, Skeleton, cn } from '@/components/basic';
import { formatCurrency } from '@/utils/format';

export interface DoctorRevenueItem {
  doctorId: string;
  doctorName: string;
  totalRevenue: number;
  appointmentCount: number;
}

export interface DoctorRevenueChartProps {
  data: DoctorRevenueItem[];
  loading?: boolean;
}

export function DoctorRevenueChart({ data, loading }: DoctorRevenueChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const { totalRevenue, totalAppointments, maxRevenue, sortedDoctors } = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalRevenue: 0, totalAppointments: 0, maxRevenue: 1, sortedDoctors: [] };
    }
    const sorted = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const rev = sorted.reduce((sum, item) => sum + item.totalRevenue, 0);
    const appts = sorted.reduce((sum, item) => sum + item.appointmentCount, 0);
    const max = Math.max(...sorted.map((item) => item.totalRevenue), 1);
    return {
      totalRevenue: rev,
      totalAppointments: appts,
      maxRevenue: max,
      sortedDoctors: sorted,
    };
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardBody className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <CardTitle as="h2" className="text-lg font-semibold text-foreground">
              Tiền thực thu theo bác sĩ
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-muted">
            Doanh thu từ các ca khám và điều trị có bác sĩ phụ trách.
          </p>
        </div>

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
      </CardHeader>

      <CardBody className="pt-2">
        {/* Quick summary header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-muted/50 px-4 py-2 text-xs">
          <div>
            <span className="text-muted">Bác sĩ tham gia: </span>
            <strong className="font-semibold text-foreground">{sortedDoctors.length} bác sĩ</strong>
          </div>
          <div>
            <span className="text-muted">Tổng lịch hẹn: </span>
            <strong className="font-semibold text-foreground">{totalAppointments.toLocaleString('vi-VN')} ca</strong>
          </div>
          <div>
            <span className="text-muted">Tổng doanh thu: </span>
            <strong className="font-semibold text-sky-600 dark:text-sky-400">
              {formatCurrency(totalRevenue)}
            </strong>
          </div>
        </div>

        {sortedDoctors.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
            Chưa có dữ liệu doanh thu theo bác sĩ trong kỳ.
          </div>
        ) : viewMode === 'chart' ? (
          <div className="space-y-3.5">
            {sortedDoctors.map((doc, index) => {
              const percentage = maxRevenue > 0 ? (doc.totalRevenue / maxRevenue) * 100 : 0;
              const shareOfTotal = totalRevenue > 0 ? (doc.totalRevenue / totalRevenue) * 100 : 0;
              const avgTicket = doc.appointmentCount > 0 ? doc.totalRevenue / doc.appointmentCount : 0;

              return (
                <div
                  key={doc.doctorId || doc.doctorName}
                  className="group rounded-xl border border-border/60 bg-surface p-3 transition-all hover:border-primary/40 hover:bg-surface-muted/30"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
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
                      <Avatar name={doc.doctorName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{doc.doctorName}</p>
                        <p className="text-[11px] text-muted">
                          {doc.appointmentCount} ca khám · TB {formatCurrency(Math.round(avgTicket))}/ca
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground [font-variant-numeric:tabular-nums]">
                        {formatCurrency(doc.totalRevenue)}
                      </p>
                      <p className="text-[11px] text-muted">Chiếm {shareOfTotal.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        index === 0
                          ? 'bg-gradient-to-r from-sky-500 to-indigo-500'
                          : index === 1
                            ? 'bg-gradient-to-r from-sky-600 to-sky-500'
                            : 'bg-sky-500/70',
                      )}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-surface-muted text-left text-xs font-semibold text-muted">
                <tr>
                  <th className="px-4 py-2.5">Thứ hạng</th>
                  <th className="px-4 py-2.5">Bác sĩ phụ trách</th>
                  <th className="px-4 py-2.5 text-right">Số ca khám</th>
                  <th className="px-4 py-2.5 text-right">Doanh thu tạo ra</th>
                  <th className="px-4 py-2.5 text-right">TB / Ca</th>
                  <th className="px-4 py-2.5 text-right">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedDoctors.map((doc, index) => {
                  const shareOfTotal = totalRevenue > 0 ? (doc.totalRevenue / totalRevenue) * 100 : 0;
                  const avg = doc.appointmentCount > 0 ? doc.totalRevenue / doc.appointmentCount : 0;
                  return (
                    <tr key={doc.doctorId || doc.doctorName} className="hover:bg-surface-muted/50">
                      <td className="px-4 py-2.5 text-muted">#{index + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{doc.doctorName}</td>
                      <td className="px-4 py-2.5 text-right [font-variant-numeric:tabular-nums]">
                        {doc.appointmentCount}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-sky-600 dark:text-sky-400 [font-variant-numeric:tabular-nums]">
                        {formatCurrency(doc.totalRevenue)}
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
