/**
 * Nền chung của các biểu đồ dashboard — P10-T3.
 *
 * Mọi biểu đồ ở đây đều MỘT CHUỖI. Đó không phải giới hạn kỹ thuật mà là kết luận từ
 * dữ liệu: tám biểu đồ của FR-24 mỗi cái trả lời đúng một câu ("doanh thu 30 ngày",
 * "thuốc dùng nhiều"), không cái nào so hai nhóm với nhau. Một chuỗi thì không cần bảng
 * chú giải (tiêu đề đã nói nó là gì) và không cần bảng màu phân loại — chỉ một sắc màu
 * duy nhất lấy từ token `--color-primary` của hệ thiết kế.
 *
 * KHÔNG KÉO THƯ VIỆN CHART. Cùng lý do đã ghi ở `LabTrendChart` (P9): mấy trăm KB và
 * một hệ theme thứ hai phải đồng bộ tay với `rgb(var(--color-*))`, đổi lại vài trăm
 * dòng SVG mà cả hệ chỉ dùng hai dạng hình.
 */

/** Một điểm dữ liệu — khớp `DashboardSeriesPoint` của backend. */
export interface ChartPoint {
  label: string;
  value: number;
}

export type ValueFormat = 'currency' | 'count';

/**
 * Rút gọn số lớn cho nhãn trục và thẻ KPI: 1.284 → 1,3K, 4.200.000 → 4,2Tr.
 *
 * Tiền Việt Nam có rất nhiều chữ số, in đủ trên trục tung thì nhãn chồng nhau và trục
 * ăn hết bề ngang của vùng vẽ. Giá trị đầy đủ vẫn còn nguyên ở tooltip và ở bảng dữ
 * liệu — không có con số nào bị giấu, chỉ là không in hết ở chỗ chật.
 */
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

/** Giá trị đầy đủ — dùng ở tooltip, nhãn trực tiếp và bảng dữ liệu. */
export function formatValue(value: number, format: ValueFormat): string {
  return format === 'currency'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
    : new Intl.NumberFormat('vi-VN').format(value);
}

/**
 * Trần trục tung làm tròn lên số đẹp (0 / 500 / 1.000 / 2.000…).
 *
 * Trần bằng đúng giá trị lớn nhất sẽ đẩy đỉnh biểu đồ chạm mép trên và cho ra những
 * vạch chia như "37.412" — trục phải đọc lướt được, nên nó làm tròn.
 */
export function niceCeiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Trần và các vạch chia của trục tung. */
export interface AxisScale {
  ceiling: number;
  ticks: number[];
}

/**
 * Thang đo trục tung — bốn vạch chia là đủ để đọc độ lớn mà chưa thành lưới kẻ ô.
 *
 * CHUỖI ĐẾM KHÔNG BAO GIỜ CÓ VẠCH LẺ. Chia đều một trần bằng 2 thành bốn phần cho ra
 * "0 / 0,5 / 1 / 1,5 / 2" — mà "0,5 lượt khám" là một đại lượng không tồn tại, và người
 * đọc phải dừng lại một nhịp để nhận ra trục chứ không phải dữ liệu mới là chỗ vô lý.
 * Với `count`, bước nhảy được ép về số nguyên rồi trần mới suy ra từ bước nhảy đó.
 */
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
