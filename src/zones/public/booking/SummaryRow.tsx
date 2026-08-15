/**
 * Một dòng "nhãn - giá trị" trong bảng tóm tắt.
 *
 * Dùng chung cho bước xác nhận và màn hình đặt lịch thành công. Tự ẩn khi không có giá
 * trị - bảng tóm tắt không nên có dòng trống.
 *
 * Phải nằm trong một `<dl>`: đây là cặp `<dt>`/`<dd>`, và đó là thứ cho trình đọc màn
 * hình biết "Bác sĩ" là nhãn của "BS. Lê Văn An" chứ không phải hai mẩu chữ cạnh nhau.
 */
export function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-none">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}
