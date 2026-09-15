import { useId } from 'react';
import { DashboardSeries } from '@/api/reports.api';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/basic';
import { RankBarChart } from '@/components/charts/RankBarChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { formatValue } from '@/components/charts/chart-utils';

const RANK_CHARTS = new Set(['topProducts', 'topMedicines', 'topServices']);

export function DashboardChartCard({ series }: { series: DashboardSeries }) {
  const titleId = useId();

  return (
    <Card as="article">
      <CardHeader>
        <CardTitle as="h3" id={titleId}>
          {series.title}
        </CardTitle>
      </CardHeader>

      <CardBody className="pt-3">
        {RANK_CHARTS.has(series.key) ? (
          <RankBarChart points={series.points} format={series.format} />
        ) : (
          <TrendLineChart points={series.points} format={series.format} labelledBy={titleId} />
        )}

        <details className="mt-3">
          <summary className="inline-flex min-h-touch cursor-pointer items-center text-sm text-muted hover:text-foreground">
            Xem dạng bảng
          </summary>
          <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-surface-muted text-left">
                  <th scope="col" className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Mốc
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    Giá trị
                  </th>
                </tr>
              </thead>
              <tbody>
                {series.points.map((point) => (
                  <tr key={point.label} className="border-t border-border">
                    <td className="px-3 py-1.5">{point.label}</td>
                    <td className="px-3 py-1.5 text-right">
                      {formatValue(point.value, series.format)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardBody>
    </Card>
  );
}
