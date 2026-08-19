import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { EmptyState, ErrorState, Pagination, SkeletonCards, usePagination } from '@/components/basic';
import { BranchCard } from '../components/BranchCard';

const PAGE_SIZE = 9;

/**
 * Trang hệ thống chi nhánh.
 *
 * Không có bộ lọc: một hệ thống phòng khám thú y có vài chi nhánh, và lọc trong một
 * danh sách ba mục là thêm một thao tác không giải quyết vấn đề gì. Nếu số chi nhánh
 * lên tới hàng chục thì thứ cần thêm là **bản đồ và sắp xếp theo khoảng cách**, không
 * phải một ô lọc.
 */
export function BranchesPage() {
  const {
    data: branches,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ['branches'], queryFn: branchesApi.list });

  const { page, setPage, pageItems, totalPages } = usePagination(branches ?? [], PAGE_SIZE);

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Hệ thống chi nhánh
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Chọn chi nhánh thuận tiện nhất để đặt lịch. Hồ sơ bệnh án của bé dùng chung giữa các chi
            nhánh, nên khám ở đâu bác sĩ cũng thấy được lịch sử điều trị.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {isError ? (
          <ErrorState
            title="Không tải được danh sách chi nhánh"
            description="Máy chủ chưa phản hồi. Vui lòng thử lại sau ít phút."
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <SkeletonCards count={3} label="Đang tải danh sách chi nhánh" />
        ) : (branches ?? []).length === 0 ? (
          <EmptyState
            title="Chưa có chi nhánh nào được công bố"
            description="Thông tin chi nhánh đang được cập nhật."
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((branch) => (
                <BranchCard key={branch.id} branch={branch} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={branches?.length ?? 0}
            />
          </>
        )}
      </section>
    </>
  );
}
