
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
