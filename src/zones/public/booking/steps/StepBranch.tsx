import { EmptyState, Skeleton } from '@/components/basic';
import { BookingForm } from '../use-booking-form';

/** Bước 1 - chọn chi nhánh. Bắt buộc: mọi thứ phía sau đều lọc theo chi nhánh. */
export function StepBranch({ branch }: { branch: BookingForm['branch'] }) {
  return (
    <section aria-labelledby="buoc-chi-nhanh">
      <h2 id="buoc-chi-nhanh" className="text-lg font-semibold text-foreground">
        Chọn chi nhánh
      </h2>
      <p className="mt-1 text-sm text-muted">
        Vui lòng chọn chi nhánh trước - đây là bước bắt buộc.
      </p>

      {branch.isLoading && (
        <div
          role="status"
          aria-busy="true"
          aria-label="Đang tải danh sách chi nhánh"
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {branch.list?.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={branch.id === item.id}
            onClick={() => branch.select(item.id)}
            className={
              'rounded-xl border p-4 text-left transition-colors ' +
              (branch.id === item.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-surface hover:border-primary/50')
            }
          >
            <p className="font-semibold text-foreground">{item.branchName}</p>
            <p className="mt-1 text-sm text-muted">{item.address}</p>
            <p className="text-sm text-muted">{item.phone}</p>
          </button>
        ))}
      </div>

      {branch.list && branch.list.length === 0 && (
        <EmptyState
          className="mt-4"
          icon="🏥"
          title="Chưa có chi nhánh nào"
          description="Hệ thống chưa cấu hình chi nhánh. Vui lòng liên hệ phòng khám để được hỗ trợ đặt lịch."
        />
      )}
    </section>
  );
}
