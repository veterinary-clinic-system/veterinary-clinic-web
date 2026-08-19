import { useState } from 'react';
import { Button, Modal, Textarea } from '@/components/basic';
import { QueueEntry } from '@/types/models';

const DEFAULT_REASON = 'Khách bỏ về trước khi được khám';

export interface CancelQueueEntryDialogProps {
  /** `null` = đóng. Truyền lượt chờ vào để mở. */
  entry: QueueEntry | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

/**
 * Huỷ một lượt chờ - kéo theo lịch hẹn sang "đã huỷ" và ghi lý do (FR-05-04).
 *
 * Trước đây dùng `window.prompt` với lý do "chỉ có một ô nhập, không đáng dựng modal".
 * Lý lẽ đó không đứng vững ở đúng màn hình này: quầy lễ tân thường có khách đứng chờ,
 * và `prompt` **chặn toàn bộ tab** - không cuộn được, không xem được hàng chờ phía sau,
 * không biết mình đang huỷ số mấy nếu vừa bấm nhầm hàng.
 *
 * Lý do mặc định điền sẵn và bôi chọn được: trường hợp phổ biến nhất chỉ cần bấm xác
 * nhận, trường hợp còn lại gõ đè lên.
 */
export function CancelQueueEntryDialog({
  entry,
  onClose,
  onConfirm,
  loading = false,
}: CancelQueueEntryDialogProps) {
  const [reason, setReason] = useState(DEFAULT_REASON);

  return (
    <Modal
      open={Boolean(entry)}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="Huỷ lượt chờ"
      className="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Giữ lượt chờ
          </Button>
          <Button variant="destructive" loading={loading} onClick={() => onConfirm(reason.trim())}>
            Huỷ lượt chờ
          </Button>
        </>
      }
    >
      {entry && (
        <p className="text-sm text-muted">
          Huỷ lượt số{' '}
          <span className="font-semibold tabular-nums text-foreground">{entry.ticketNumber}</span> -{' '}
          <span className="font-medium text-foreground">{entry.pet?.name ?? 'thú cưng'}</span>. Lịch
          hẹn tương ứng cũng chuyển sang trạng thái đã huỷ.
        </p>
      )}

      <Textarea
        label="Lý do huỷ"
        className="mt-4"
        rows={2}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        hint="Bỏ trống thì hệ thống ghi lý do mặc định."
      />
    </Modal>
  );
}
