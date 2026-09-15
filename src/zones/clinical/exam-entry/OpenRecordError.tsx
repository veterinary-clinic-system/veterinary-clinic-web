import { Alert, ForbiddenState } from '@/components/basic';
import { isForbiddenError } from '@/utils/errors';
import { extractApiMessage } from './api-utils';

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
