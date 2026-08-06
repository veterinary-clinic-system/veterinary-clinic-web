import { useState } from 'react';
import { buildScale, ChartPoint, formatValue, ValueFormat } from './chart-utils';
import { EmptyPlot } from './TrendLineChart';

/**
 * Bảng xếp hạng dạng thanh ngang — dùng cho "bán chạy / dùng nhiều / phổ biến" (FR-24).
 *
 * NGANG chứ không đứng: tên hàng hoá tiếng Việt dài ("Thức ăn hạt Royal Canin 2kg"),
 * đặt dưới trục hoành của biểu đồ cột thì phải xoay nghiêng hoặc cắt bớt — cả hai đều
 * khó đọc. Thanh ngang cho nhãn nằm ngang, đọc bình thường.
 *
 * Dựng bằng div chứ không SVG: thanh ngang là những hình chữ nhật xếp dọc, đúng thứ
 * bố cục dòng chảy của HTML làm sẵn — và nhãn dài tự xuống dòng được, việc mà `<text>`
 * trong SVG không tự làm.
 */
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
  // Chia theo TRẦN LÀM TRÒN chứ không theo giá trị lớn nhất: nếu chia theo giá trị lớn
  // nhất thì hạng nhất luôn dài kín khung, và người đọc mất mốc so sánh tuyệt đối.
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
          {/* Rãnh nền là một bậc nhạt của cùng sắc màu, không phải xám trung tính —
              nhờ vậy phần chưa lấp vẫn thuộc về cùng một thang đo. */}
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
