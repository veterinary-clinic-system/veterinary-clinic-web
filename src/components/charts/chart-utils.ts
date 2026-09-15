

export interface ChartPoint {
  label: string;
  value: number;
}

export type ValueFormat = 'currency' | 'count';

export function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${trimZero(value / 1_000_000_000)}Tỷ`;
  if (abs >= 1_000_000) return `${trimZero(value / 1_000_000)}Tr`;
  if (abs >= 1_000) return `${trimZero(value / 1_000)}K`;
  return new Intl.NumberFormat('vi-VN').format(value);
}

function trimZero(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value);
}

export function formatValue(value: number, format: ValueFormat): string {
  return format === 'currency'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
    : new Intl.NumberFormat('vi-VN').format(value);
}

export function niceCeiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export interface AxisScale {
  ceiling: number;
  ticks: number[];
}

export function buildScale(max: number, format: ValueFormat): AxisScale {
  if (format === 'currency') {
    const ceiling = niceCeiling(max);
    return { ceiling, ticks: tickList(ceiling, ceiling / 4) };
  }

  const step = Math.max(1, Math.round(niceCeiling(Math.max(max, 1) / 4)));
  const ceiling = Math.max(step, Math.ceil(max / step) * step);
  return { ceiling, ticks: tickList(ceiling, step) };
}

function tickList(ceiling: number, step: number): number[] {
  const ticks: number[] = [];
  for (let value = 0; value <= ceiling + step / 1000; value += step) {
    ticks.push(value);
  }
  return ticks;
}
