import { extractApiMessage } from './api-utils';

/**
 * BR-06 (chưa check-in) và lịch hẹn đã kết thúc đều trả 409 kèm thông báo tiếng Việt
 * đã đủ rõ - hiển thị nguyên văn thay vì dịch lại một lần nữa ở client.
 */
export function OpenRecordError({ error }: { error: unknown }) {
  const message = extractApiMessage(error) ?? 'Không thể mở hồ sơ bệnh án cho lịch hẹn này.';
  return (
    <div className="rounded border border-destructive bg-destructive/5 p-4">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}
