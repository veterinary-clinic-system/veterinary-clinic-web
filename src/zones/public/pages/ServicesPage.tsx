import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import {
  EmptyState,
  ErrorState,
  Pagination,
  SearchInput,
  Select,
  SkeletonCards,
  usePagination,
} from '@/components/basic';
import { ServiceCard } from '../components/ServiceCard';

const PAGE_SIZE = 9;

/** Ba khoảng giá đủ để trả lời "có gì trong tầm tiền của tôi không". */
const PRICE_BANDS = [
  { value: '', label: 'Mọi mức giá' },
  { value: 'lt300', label: 'Dưới 300.000 đ' },
  { value: '300to800', label: '300.000 - 800.000 đ' },
  { value: 'gt800', label: 'Trên 800.000 đ' },
];

function inPriceBand(price: number, band: string): boolean {
  if (band === 'lt300') return price < 300_000;
  if (band === '300to800') return price >= 300_000 && price <= 800_000;
  if (band === 'gt800') return price > 800_000;
  return true;
}

/**
 * Bảng giá dịch vụ công khai.
 *
 * Hai bộ lọc, không nhiều hơn: **từ khoá** cho người biết mình cần gì ("tiêm phòng"),
 * và **khoảng giá** cho người đang cân nhắc chi phí. Lọc theo chuyên khoa hay theo chi
 * nhánh nghe hợp lý nhưng thực tế không ai dùng - dịch vụ giống nhau ở mọi chi nhánh.
 *
 * Danh sách vẫn là lưới thẻ chứ không phải bảng: mỗi mục có mô tả dài ngắn khác nhau
 * và kết thúc bằng một nút hành động, hai thứ mà bảng xử lý rất tệ.
 */
export function ServicesPage() {
  const [search, setSearch] = useState('');
  const [priceBand, setPriceBand] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['catalog', 'services', 'public'],
    queryFn: () => catalogApi.services({ limit: 100 }),
  });

  const services = useMemo(() => {
    const active = (data?.data ?? []).filter((s) => s.active && s.item.active);
    const keyword = search.trim().toLowerCase();

    return active.filter((service) => {
      if (!inPriceBand(service.item.unitPrice, priceBand)) return false;
      if (!keyword) return true;
      return (
        service.item.itemName.toLowerCase().includes(keyword) ||
        (service.item.describe ?? '').toLowerCase().includes(keyword)
      );
    });
  }, [data, search, priceBand]);

  const { page, setPage, pageItems, totalPages } = usePagination(services, PAGE_SIZE, [
    search,
    priceBand,
  ]);

  const filtering = Boolean(search.trim() || priceBand);

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dịch vụ &amp; bảng giá
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Toàn bộ dịch vụ khám chữa bệnh, tiêm phòng và chăm sóc thú cưng của hệ thống, kèm mức giá
            tham khảo và thời lượng dự kiến. Giá cuối cùng có thể thay đổi theo tình trạng thực tế
            của bé sau khi bác sĩ thăm khám.
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <SearchInput
              value={search}
              onValueChange={setSearch}
              label="Tìm dịch vụ"
              placeholder="Tìm dịch vụ (ví dụ: tiêm phòng, siêu âm...)"
              className="w-full sm:max-w-sm"
            />
            <Select
              label="Khoảng giá"
              value={priceBand}
              onChange={setPriceBand}
              options={PRICE_BANDS}
              className="min-w-[12rem]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {isError ? (
          <ErrorState
            title="Không tải được bảng giá"
            description="Máy chủ chưa phản hồi. Bạn có thể thử lại, hoặc gọi trực tiếp cho chi nhánh gần nhất."
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <SkeletonCards count={6} label="Đang tải bảng giá dịch vụ" />
        ) : services.length === 0 ? (
          <EmptyState
            title={filtering ? 'Không có dịch vụ nào khớp bộ lọc' : 'Bảng giá đang được cập nhật'}
            description={
              filtering
                ? 'Thử bỏ bớt điều kiện lọc, hoặc mô tả triệu chứng với trợ lý AI để được gợi ý dịch vụ phù hợp.'
                : 'Hệ thống chưa công bố dịch vụ nào. Vui lòng liên hệ chi nhánh gần nhất.'
            }
            action={
              filtering ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPriceBand('');
                  }}
                  className="inline-flex min-h-touch items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-muted"
                >
                  Xoá bộ lọc
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={services.length}
            />
          </>
        )}
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-foreground">Chưa rõ nên chọn dịch vụ nào?</h2>
            <p className="mt-1 text-muted">
              Mô tả triệu chứng với trợ lý AI để được gợi ý, hoặc đặt lịch và để phòng khám sắp xếp
              bác sĩ phù hợp.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/chat"
              className="inline-flex min-h-touch items-center rounded-lg border border-border px-5 font-medium text-foreground hover:bg-surface-muted"
            >
              Tư vấn cùng AI
            </Link>
            <Link
              to="/booking"
              className="inline-flex min-h-touch items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Đặt lịch khám
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
