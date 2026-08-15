/**
 * Thứ hiện ra trong lúc gói JavaScript của một zone đang tải.
 *
 * Cố ý rất nhạt: gói zone thường về trong vài trăm mili giây, và một khối skeleton
 * dựng sẵn nhấp nháy rồi biến mất ngay còn chói mắt hơn là một khoảng trống. Phần
 * skeleton thật nằm ở TRONG mỗi trang, nơi biết mình sắp vẽ ra hình gì.
 *
 * `role="status"` + nhãn để trình đọc màn hình biết là đang chờ chứ không phải trang
 * trống; `min-h` giữ chân trang không nhảy vọt lên giữa màn hình.
 */
export function RouteFallback() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Đang tải trang"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
