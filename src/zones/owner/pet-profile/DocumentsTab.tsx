import { PetTimelineEntry } from '@/api/pets.api';
import { EmptyState, Icon, SkeletonText } from '@/components/basic';
import { formatDate } from '@/utils/format';

/**
 * Ảnh và tệp đính kèm của các buổi khám.
 *
 * Nguồn dữ liệu là `examination.attachmentUrls` trong dòng thời gian - không có API
 * riêng cho "tài liệu của thú cưng", và dựng một cái chỉ để gom lại thứ đã có sẵn thì
 * thừa.
 *
 * Nhóm theo buổi khám chứ không đổ thành một lưới ảnh phẳng: một tấm ảnh tổn thương da
 * chỉ có nghĩa khi biết nó chụp ngày nào, trong lần khám nào.
 */
export function DocumentsTab({
  entries,
  isLoading,
}: {
  entries: PetTimelineEntry[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) return <SkeletonText lines={4} />;

  const withFiles = (entries ?? []).filter(
    (entry) => (entry.examination?.attachmentUrls?.length ?? 0) > 0,
  );

  if (withFiles.length === 0) {
    return (
      <EmptyState
        icon="📎"
        title="Chưa có tài liệu nào"
        description="Ảnh và kết quả bác sĩ đính kèm trong các buổi khám sẽ xuất hiện tại đây."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {withFiles.map((entry) => (
        <section key={entry.id}>
          <h3 className="text-sm font-medium text-foreground">
            Buổi khám ngày {formatDate(entry.startAt)}
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {entry.examination?.attachmentUrls.map((url, index) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-primary/40"
                >
                  <img
                    src={url}
                    alt={`Tài liệu ${index + 1} của buổi khám ngày ${formatDate(entry.startAt)}`}
                    loading="lazy"
                    className="aspect-square w-full bg-surface-muted object-cover"
                  />
                  <span className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted group-hover:text-primary">
                    <Icon name="download" className="h-3.5 w-3.5" />
                    Mở tệp
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
