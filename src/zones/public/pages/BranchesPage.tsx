import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { Pagination, usePagination } from '@/components/basic';
import { OperatingHour } from '@/types/models';
import { WEEKDAY_LABELS_VI, formatTimeHHmm } from '@/utils/display';

function OpeningHoursList({ hours }: { hours: OperatingHour[] }) {
  const sorted = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  return (
    <ul className="mt-2 space-y-0.5 text-sm text-muted">
      {sorted.map((hour) => (
        <li key={hour.id} className="flex justify-between gap-4">
          <span>{WEEKDAY_LABELS_VI[hour.dayOfWeek]}</span>
          <span>
            {formatTimeHHmm(hour.openTime)} - {formatTimeHHmm(hour.closeTime)}
          </span>
        </li>
      ))}
    </ul>
  );
}

const PAGE_SIZE = 9;

export function BranchesPage() {
  const { data: branches, isLoading, isError } = useQuery({
    queryKey: ['branches'],
    queryFn: branchesApi.list,
  });

  const { page, setPage, pageItems, totalPages } = usePagination(branches ?? [], PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Hệ thống chi nhánh</h1>
      <p className="mt-1 text-muted">Chọn chi nhánh gần bạn nhất để đặt lịch khám cho thú cưng.</p>

      {isLoading && <p className="mt-8 text-muted">Đang tải danh sách chi nhánh...</p>}
      {isError && <p className="mt-8 text-destructive">Không thể tải danh sách chi nhánh. Vui lòng thử lại sau.</p>}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((branch) => (
          <div key={branch.id} className="rounded border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">{branch.branchName}</h2>
            <p className="mt-1 text-sm text-muted">{branch.address}</p>
            <p className="mt-1 text-sm text-muted">Điện thoại: {branch.phone}</p>
            {branch.description && <p className="mt-2 text-sm text-foreground">{branch.description}</p>}
            {branch.openingHours && branch.openingHours.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-sm font-medium text-foreground">Giờ mở cửa</p>
                <OpeningHoursList hours={branch.openingHours} />
              </div>
            )}
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={branches?.length ?? 0}
      />

      {branches && branches.length === 0 && (
        <p className="mt-8 text-muted">Hiện chưa có chi nhánh nào được công bố.</p>
      )}
    </div>
  );
}
