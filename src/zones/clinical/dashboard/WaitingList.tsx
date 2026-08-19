import { Link } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Skeleton,
  TriageBadge,
} from '@/components/basic';
import { QueueEntry } from '@/types/models';

export interface WaitingListProps {
  entries: QueueEntry[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/**
 * Danh sách bệnh nhân đang chờ.
 *
 * Hiện **thời gian đã chờ**, không phải giờ check-in. "Đã chờ 40 phút" là con số dẫn
 * tới hành động; "check-in lúc 09:15" bắt người đọc tự trừ, và họ sẽ không trừ.
 *
 * Số thứ tự (`ticketNumber`) đứng đầu mỗi hàng vì đó là thứ lễ tân gọi thành tiếng.
 */
export function WaitingList({ entries, isLoading, isError, onRetry }: WaitingListProps) {
  return (
    <Card as="section">
      <CardHeader>
        <CardTitle as="h2">Đang chờ</CardTitle>
        <Link to="/staff/queue" className="text-sm font-medium text-primary hover:underline">
          Mở hàng chờ
        </Link>
      </CardHeader>

      <CardBody className="pt-3">
        {isError ? (
          <ErrorState title="Không tải được hàng chờ" onRetry={onRetry} />
        ) : isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-row w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            className="border-0 bg-transparent px-0 py-6"
            title="Không có ai đang chờ"
            description="Hàng chờ trống - phòng khám đang theo kịp lịch."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-sm font-semibold tabular-nums text-foreground">
                  {entry.ticketNumber}
                </span>

                <span className="min-w-0 flex-1">
                  <Link
                    to={`/staff/patients/${entry.petId}`}
                    className="block truncate text-data font-medium text-foreground hover:text-primary"
                  >
                    {entry.pet?.name ?? 'Chưa có hồ sơ'}
                  </Link>
                  <span className="block truncate text-xs text-muted">
                    Đã chờ{' '}
                    {formatDistanceToNowStrict(new Date(entry.checkedInAt), { locale: vi })}
                    {entry.doctor?.fullName && ` · ${entry.doctor.fullName}`}
                  </span>
                </span>

                {entry.priorityColor && <TriageBadge color={entry.priorityColor} />}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
