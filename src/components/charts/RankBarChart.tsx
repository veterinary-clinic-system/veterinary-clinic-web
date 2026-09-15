import { useState } from 'react';
import { buildScale, ChartPoint, formatValue, ValueFormat } from './chart-utils';
import { EmptyPlot } from './TrendLineChart';

export function RankBarChart({
  points,
  format,
  limit = 8,
}: {
  points: ChartPoint[];
  format: ValueFormat;
  limit?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);

  if (points.length === 0) {
    return <EmptyPlot message="Chưa có giao dịch nào trong kỳ." />;
  }

  const rows = points.slice(0, limit);

  const { ceiling } = buildScale(Math.max(...rows.map((row) => row.value)), format);

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li
          key={row.label}
          className="flex flex-col gap-1"
          onMouseEnter={() => setHover(row.label)}
          onMouseLeave={() => setHover(null)}
        >
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate" title={row.label}>
              {row.label}
            </span>
            <span className="shrink-0 font-medium [font-variant-numeric:tabular-nums]">
              {hover === row.label ? formatValue(row.value, format) : row.value.toLocaleString('vi-VN')}
            </span>
          </div>
          {}
          <div className="h-2 w-full rounded-sm bg-primary/10">
            <div
              className="h-2 rounded-r-[4px] bg-primary"
              style={{ width: `${Math.max((row.value / ceiling) * 100, 2)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
