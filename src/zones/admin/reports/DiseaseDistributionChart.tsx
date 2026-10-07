import { useMemo } from 'react';
import { Card, CardBody, CardHeader, CardTitle, Skeleton } from '@/components/basic';

export interface DiseaseGroupItem {
  diseaseGroup: string;
  count: number;
}

export interface DiseaseDistributionChartProps {
  data: DiseaseGroupItem[];
  loading?: boolean;
}

export function DiseaseDistributionChart({ data, loading }: DiseaseDistributionChartProps) {
  const { totalCases, maxCount, sortedList } = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalCases: 0, maxCount: 1, sortedList: [] };
    }
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const sum = sorted.reduce((acc, cur) => acc + cur.count, 0);
    const max = Math.max(...sorted.map((item) => item.count), 1);
    return {
      totalCases: sum,
      maxCount: max,
      sortedList: sorted,
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
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </span>
            <CardTitle as="h2" className="text-lg font-semibold text-foreground">
              Nhóm bệnh thường gặp nhất
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-muted">
            Tổng hợp các bệnh lý và chẩn đoán phổ biến từ các ca khám trong kỳ.
          </p>
        </div>

        <div className="rounded-lg bg-surface-muted/60 px-3 py-1 text-xs text-muted">
          Tổng cộng: <strong className="font-semibold text-foreground">{totalCases.toLocaleString('vi-VN')} ca bệnh</strong>
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        {sortedList.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
            Không có chẩn đoán bệnh nào trong kỳ.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedList.map((item, index) => {
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              const shareOfTotal = totalCases > 0 ? (item.count / totalCases) * 100 : 0;

              return (
                <div
                  key={item.diseaseGroup}
                  className="group rounded-xl border border-border/60 bg-surface p-3 transition-all hover:border-purple-400/40 hover:bg-surface-muted/30"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-xs font-bold text-purple-600 dark:text-purple-400">
                        {index + 1}
                      </span>
                      <span className="truncate font-medium text-foreground" title={item.diseaseGroup}>
                        {item.diseaseGroup}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-right shrink-0 [font-variant-numeric:tabular-nums]">
                      <span className="font-semibold text-foreground">{item.count.toLocaleString('vi-VN')} ca</span>
                      <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-muted">
                        {shareOfTotal.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
