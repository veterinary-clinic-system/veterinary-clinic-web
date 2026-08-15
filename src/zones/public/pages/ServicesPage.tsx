import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import { Pagination, usePagination } from '@/components/basic';
import { Service } from '@/types/models';
import { formatCurrency } from '@/utils/format';

const PAGE_SIZE = 9;

/**
 * Bảng giá dịch vụ công khai (phản hồi nghiệm thu: "Đề xuất thêm trang 'dịch vụ'.
 * Trang này thể hiện danh sách các dịch vụ của phòng khám có bao gồm giá tiền và có
 * luôn nút 'Đặt lịch hẹn ngay'").
 *
 * Nút đặt lịch chuyển sang /booking kèm `serviceId` trong `location.state` - biểu mẫu
 * đặt lịch đọc nó ra và chọn sẵn dịch vụ (xem `BookingHandoffState`).
 */
function ServiceCard({ service, onBook }: { service: Service; onBook: () => void }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">{service.item.itemName}</h3>
        <span className="whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          {formatCurrency(service.item.unitPrice)}
        </span>
      </div>

      {service.item.describe && <p className="mt-2 flex-1 text-sm text-muted">{service.item.describe}</p>}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Thời lượng khoảng {service.durationMinutes} phút</span>
        <button
          type="button"
          onClick={onBook}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Đặt lịch hẹn ngay
        </button>
      </div>
    </div>
  );
}

export function ServicesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['catalog', 'services', 'public'],
    queryFn: () => catalogApi.services({ limit: 100 }),
  });

  const services = useMemo(() => {
    const active = (data?.data ?? []).filter((s) => s.active && s.item.active);
    const keyword = search.trim().toLowerCase();
    if (!keyword) return active;
    return active.filter(
      (s) =>
        s.item.itemName.toLowerCase().includes(keyword) ||
        (s.item.describe ?? '').toLowerCase().includes(keyword),
    );
  }, [data, search]);

  const { page, setPage, pageItems, totalPages } = usePagination(services, PAGE_SIZE, [search]);

  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h1 className="text-3xl font-bold text-foreground">Dịch vụ &amp; bảng giá</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Toàn bộ dịch vụ khám chữa bệnh, tiêm phòng và chăm sóc thú cưng tại hệ thống phòng khám,
            kèm mức giá tham khảo. Giá cuối cùng có thể thay đổi theo tình trạng thực tế của thú cưng
            sau khi bác sĩ thăm khám.
          </p>
          <div className="mt-6 max-w-md">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm dịch vụ (ví dụ: tiêm phòng, siêu âm...)"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {isLoading && <p className="text-muted">Đang tải bảng giá dịch vụ...</p>}
        {isError && <p className="text-destructive">Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.</p>}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onBook={() => navigate('/booking', { state: { serviceId: service.id } })}
            />
          ))}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={services.length}
        />

        {!isLoading && services.length === 0 && (
          <p className="text-muted">Không tìm thấy dịch vụ nào phù hợp.</p>
        )}
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Chưa rõ nên chọn dịch vụ nào?</h2>
            <p className="mt-1 text-muted">
              Mô tả triệu chứng với trợ lý AI để được gợi ý, hoặc để phòng khám sắp xếp bác sĩ phù hợp.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/chat" className="rounded-lg border border-border px-5 py-2.5 font-medium text-foreground">
              Tư vấn cùng AI
            </Link>
            <Link to="/booking" className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground">
              Đặt lịch khám
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
