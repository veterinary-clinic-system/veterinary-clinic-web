import { useMemo } from 'react';
import { LabResultFlag, LabTrendPoint } from '@/types/models';
import { formatDate } from '@/utils/format';

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 32, left: 56 };

const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

export function LabTrendChart({
  points,
  unit,
}: {
  points: LabTrendPoint[];
  unit: string | null;
}) {
  const geometry = useMemo(() => computeGeometry(points), [points]);

  if (points.length === 0) {
    return null;
  }

  const { xOf, yOf, yTicks, band } = geometry;

  return (
    <figure className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full min-w-[480px]"
        role="img"
        aria-label={`Biểu đồ xu hướng, ${points.length} lần đo`}
      >
        {}
        {band && (
          <rect
            x={PADDING.left}
            y={band.y}
            width={PLOT_WIDTH}
            height={band.height}
            className="fill-triage-green/10"
          />
        )}

        {yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={PADDING.left}
              x2={PADDING.left + PLOT_WIDTH}
              y1={tick.y}
              y2={tick.y}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-muted text-[10px]"
            >
              {formatTick(tick.value)}
            </text>
          </g>
        ))}

        {points.length > 1 && (
          <polyline
            points={points.map((point, index) => `${xOf(index)},${yOf(point.value)}`).join(' ')}
            className="stroke-primary"
            strokeWidth={2}
            fill="none"
          />
        )}

        {points.map((point, index) => (
          <g key={`${point.labTestOrderId}-${index}`}>
            <circle
              cx={xOf(index)}
              cy={yOf(point.value)}
              r={4}
              className={pointClasses(point.flag)}
            />
            <title>
              {`${formatDate(point.measuredAt)}: ${point.value}${unit ? ` ${unit}` : ''}`}
            </title>
          </g>
        ))}

        {}
        {points
          .map((point, index) => ({ point, index }))
          .filter(({ index }) => labelVisible(index, points.length))
          .map(({ point, index }) => (
            <text
              key={`label-${point.labTestOrderId}-${index}`}
              x={xOf(index)}
              y={HEIGHT - PADDING.bottom + 16}
              textAnchor="middle"
              className="fill-muted text-[10px]"
            >
              {formatDate(point.measuredAt)}
            </text>
          ))}
      </svg>
      <figcaption className="mt-1 text-xs text-muted">
        {unit ? `Đơn vị: ${unit}. ` : ''}
        Vùng xanh là khoảng tham chiếu của lần đo gần nhất.
      </figcaption>
    </figure>
  );
}

function computeGeometry(points: LabTrendPoint[]) {
  const values = points.map((point) => point.value);
  const latest = points[points.length - 1];

  const candidates = [
    ...values,
    ...(latest?.referenceMin != null ? [latest.referenceMin] : []),
    ...(latest?.referenceMax != null ? [latest.referenceMax] : []),
  ];
  const rawMin = Math.min(...candidates);
  const rawMax = Math.max(...candidates);

  const span = rawMax - rawMin || Math.abs(rawMax) * 0.2 || 1;
  const min = rawMin - span * 0.1;
  const max = rawMax + span * 0.1;

  const yOf = (value: number) =>
    PADDING.top + PLOT_HEIGHT - ((value - min) / (max - min)) * PLOT_HEIGHT;
  const xOf = (index: number) =>
    points.length === 1
      ? PADDING.left + PLOT_WIDTH / 2
      : PADDING.left + (index / (points.length - 1)) * PLOT_WIDTH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = min + (max - min) * (1 - ratio);
    return { value, y: PADDING.top + PLOT_HEIGHT * ratio };
  });

  const bandTop = latest?.referenceMax ?? null;
  const bandBottom = latest?.referenceMin ?? null;
  const band =
    bandTop === null && bandBottom === null
      ? null
      : (() => {
          const top = yOf(bandTop ?? max);
          const bottom = yOf(bandBottom ?? min);
          return { y: top, height: Math.max(bottom - top, 1) };
        })();

  return { xOf, yOf, yTicks, band };
}

function pointClasses(flag: LabResultFlag): string {
  switch (flag) {
    case LabResultFlag.CRITICAL:
      return 'fill-triage-red';
    case LabResultFlag.HIGH:
      return 'fill-triage-orange';
    case LabResultFlag.LOW:
      return 'fill-triage-blue';
    case LabResultFlag.NORMAL:
      return 'fill-primary';
  }
}

function labelVisible(index: number, total: number): boolean {
  if (total <= 6) {
    return true;
  }
  const step = Math.ceil(total / 6);
  return index === 0 || index === total - 1 || index % step === 0;
}

function formatTick(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
