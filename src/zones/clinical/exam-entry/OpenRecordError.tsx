import { Alert, ForbiddenState } from '@/components/basic';
import { isForbiddenError } from '@/utils/errors';
import { extractApiMessage } from './api-utils';

/**
 * Lỗi khi mở hồ sơ bệnh án của một lịch hẹn. Ba loại, ba câu trả lời khác nhau:
 *
 * - **409** - BR-06 (chưa check-in) hoặc lịch hẹn đã kết thúc. Backend trả sẵn câu
 *   tiếng Việt đủ rõ, hiển thị nguyên văn thay vì dịch lại một lần nữa ở client.
 * - **403** - lễ tân mở phiếu khám của bác sĩ. Route `/staff/appointments/:id/exam` mở
 *   cho cả bốn vai trò phòng khám vì lễ tân cần xem lịch hẹn, nhưng `MEDICAL_RECORD_*`
 *   thì ma trận quyền chỉ cấp cho bác sĩ. Đây không phải lỗi - nói thẳng là không có
 *   quyền, kèm lối ra.
 * - còn lại - một câu chung.
 */
export function OpenRecordError({ error }: { error: unknown }) {
  if (isForbiddenError(error)) {
    return (
      <ForbiddenState
        title="Bạn không có quyền mở phiếu khám"
        description="Chỉ bác sĩ được lập và xem hồ sơ bệnh án. Bạn vẫn xem được thông tin lịch hẹn ở màn hình trước."
        backTo="/staff/queue"
        backLabel="Về hàng chờ"
      />
    );
  }

  return (
    <Alert tone="danger" title="Không mở được hồ sơ bệnh án">
      {extractApiMessage(error) ?? 'Không thể mở hồ sơ bệnh án cho lịch hẹn này.'}
    </Alert>
  );
}
