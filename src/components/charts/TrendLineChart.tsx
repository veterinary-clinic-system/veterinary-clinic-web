import { useMemo, useState } from 'react';
import { buildScale, ChartPoint, compactNumber, formatValue, ValueFormat } from './chart-utils';

const WIDTH = 640;
const HEIGHT = 200;
const PADDING = { top: 12, right: 16, bottom: 26, left: 52 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

export function TrendLineChart({
  points,
  format,
  labelledBy,
}: {
  points: ChartPoint[];
  format: ValueFormat;
  
  labelledBy: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const { scale, coords, peakIndex } = useMemo(() => {
    const max = Math.max(...points.map((point) => point.value), 0);
    const axis = buildScale(max, format);
    const stepX = points.length > 1 ? PLOT_WIDTH / (points.length - 1) : 0;

    return {
      scale: axis,
      peakIndex: max > 0 ? points.findIndex((point) => point.value === max) : -1,
      coords: points.map((point, index) => ({
        x: PADDING.left + stepX * index,
        y: PADDING.top + PLOT_HEIGHT - (point.value / axis.ceiling) * PLOT_HEIGHT,
      })),
    };
  }, [points, format]);

  if (points.length === 0) {
    return <EmptyPlot message="Chưa có dữ liệu cho khoảng thời gian này." />;
  }

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${PADDING.top + PLOT_HEIGHT} L ${coords[0].x} ${PADDING.top + PLOT_HEIGHT} Z`;
  const last = coords[coords.length - 1];
  const active = hover ?? points.length - 1;

  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-labelledby={labelledBy}
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHover(null)}
      >
        {scale.ticks.map((tick) => {
          const y = PADDING.top + PLOT_HEIGHT - (tick / scale.ceiling) * PLOT_HEIGHT;
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted text-[10px] [font-variant-numeric:tabular-nums]"
              >
                {compactNumber(tick)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} className="fill-primary/10" />
        <path
          d={linePath}
          className="stroke-primary"
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => (
          <text
            key={point.label}
            x={coords[index].x}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            {index % labelEvery === 0 ? point.label : ''}
          </text>
        ))}

        {}
        {peakIndex >= 0 && peakIndex !== points.length - 1 && (
          <text
            x={coords[peakIndex].x}
            y={coords[peakIndex].y - 8}
            textAnchor="middle"
            className="fill-foreground text-[10px] font-medium"
          >
            {compactNumber(points[peakIndex].value)}
          </text>
        )}

        <circle cx={last.x} cy={last.y} r={5} className="fill-primary stroke-surface" strokeWidth={2} />
        <text
          x={last.x}
          y={last.y - 10}
          textAnchor="end"
          className="fill-foreground text-[10px] font-medium"
        >
          {compactNumber(points[points.length - 1].value)}
        </text>

        {}
        {hover !== null && (
          <line
            x1={coords[hover].x}
            x2={coords[hover].x}
            y1={PADDING.top}
            y2={PADDING.top + PLOT_HEIGHT}
            className="stroke-muted"
            strokeWidth={1}
          />
        )}
        {points.map((point, index) => (
          <rect
            key={`hit-${point.label}`}
            x={coords[index].x - PLOT_WIDTH / points.length / 2}
            y={PADDING.top}
            width={PLOT_WIDTH / points.length}
            height={PLOT_HEIGHT}
            fill="transparent"
            onMouseEnter={() => setHover(index)}
          />
        ))}
      </svg>

      <p className="mt-1 text-sm text-muted">
        <span className="font-medium text-foreground">{points[active].label}</span>{' '}
        {formatValue(points[active].value, format)}
        {hover === null && ' (mới nhất)'}
      </p>
    </div>
  );
}

export function EmptyPlot({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded border border-dashed border-border text-sm text-muted">
      {message}
    </div>
  );
}
