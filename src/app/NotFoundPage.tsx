import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">404 - Không tìm thấy trang</h1>
      <p className="text-muted">Trang bạn tìm không tồn tại hoặc đã bị di chuyển.</p>
      <Link to="/" className="rounded bg-primary px-4 py-2 text-primary-foreground">
        Về trang chủ
      </Link>
    </div>
  );
}
