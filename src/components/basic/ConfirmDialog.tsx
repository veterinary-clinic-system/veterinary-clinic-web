import { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  /** Nói rõ HẬU QUẢ, không chỉ hỏi lại. "Xoá 3 sản phẩm khỏi đơn đặt hàng?" */
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Đặt true cho hành động không hoàn tác được - nút xác nhận đổi sang màu cảnh báo. */
  destructive?: boolean;
  loading?: boolean;
}

/**
 * Hộp thoại xác nhận cho hành động không hoàn tác được.

 * Ba quy tắc, đều là để người dùng không bấm nhầm theo quán tính:
 *
 * 1. Nhãn nút phải là ĐỘNG TỪ của việc sắp làm ("Xoá đơn hàng"), không phải "OK". Người
 *    ta đọc nút chứ hiếm khi đọc hết câu hỏi.
 * 2. Mô tả nói hậu quả cụ thể, kèm số lượng và tên bản ghi khi có.
 * 3. Nút huỷ đứng TRƯỚC nút xác nhận và là nút được focus đầu tiên - nhấn Enter theo
 *    phản xạ thì không mất dữ liệu.
 */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      className="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-muted">{description}</div>
    </Modal>
  );
}
