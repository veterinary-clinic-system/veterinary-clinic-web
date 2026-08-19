import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { Icon, Skeleton, SkeletonText } from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { formatDateTime } from '@/utils/format';
import { CurrentVisitPanel } from '../exam-entry/CurrentVisitPanel';
import { OpenRecordError } from '../exam-entry/OpenRecordError';
import { PatientSummaryPanel } from '../exam-entry/PatientSummaryPanel';
import { PetHistoryPanel } from '../exam-entry/PetHistoryPanel';

/**
 * Màn hình khám bệnh - UC-03. Đây là màn hình quan trọng nhất đối với bác sĩ.
 *
 * Bố cục BA CỘT (mục 26 của đặc tả giao diện):
 *
 *     +-------------+---------------------------+-------------+
 *     | Bệnh nhân   | Phiếu khám lần này        | Bệnh sử     |
 *     | dị ứng      | sinh hiệu, chẩn đoán,     | các lần     |
 *     | lý do khám  | điều trị, XN, đơn thuốc   | trước       |
 *     +-------------+---------------------------+-------------+
 *
 * Ba cột chứ không phải hai vì ba câu hỏi này được hỏi ở ba nhịp khác nhau trong một ca
 * khám: *đúng con vật chưa* (một lần, đầu ca), *nhập gì bây giờ* (suốt ca), *lần trước
 * thế nào* (mở ra đóng vào). Nhồi hai cái đầu vào một cột thì cột đó phải cuộn, và cân
 * nặng - thứ dùng để tính liều - trôi khỏi màn hình đúng lúc cần nhất.
 *
 * Dưới `xl` thì xếp chồng, cột giữa lên trước: trên máy tính bảng ở phòng khám, thứ bác
 * sĩ chạm vào là biểu mẫu, không phải hai cột tham chiếu.
 *
 * Trang này chỉ LẮP RÁP: mỗi khối của cột giữa (hành chính, sinh hiệu, chẩn đoán, điều
 * trị, xét nghiệm, tiêm chủng, đơn thuốc, hoàn tất, tái khám) là một component độc lập
 * trong `../exam-entry/` - tự có state, truy vấn và mutation riêng, không như các bước
 * của một wizard.
 */
export function ExamEntryPage() {
  const { id: appointmentId } = useParams<{ id: string }>();

  const apptQuery = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentsApi.getOne(appointmentId!),
    enabled: !!appointmentId,
  });

  // `POST /medical-records` là idempotent ở phía server (trả về hồ sơ đã có nếu lịch hẹn
  // này đã mở), nên gọi thẳng nó khi vào màn hình là an toàn - không cần thử GET rồi mới
  // POST. Đây chính là hành vi acceptance đòi: vào từ nút "Phiếu khám" là tự mở hồ sơ DRAFT.
  const recordQuery = useQuery({
    queryKey: ['medical-record', 'by-appointment', appointmentId],
    queryFn: () => medicalRecordsApi.open({ appointmentId: appointmentId! }),
    enabled: !!appointmentId,
    retry: false,
  });

  if (apptQuery.isLoading || recordQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-1/2" />
        <SkeletonText lines={10} />
      </div>
    );
  }

  if (!apptQuery.data) {
    return (
      <QueryErrorState
        error={apptQuery.error}
        title="Không tìm thấy lịch hẹn"
        description="Lịch hẹn có thể đã bị huỷ, hoặc mã trong đường dẫn không đúng."
        onRetry={() => void apptQuery.refetch()}
      />
    );
  }

  const appt = apptQuery.data;

  return (
    <div className="flex flex-col gap-stack">
      <div>
        <Link
          to={`/staff/appointments/${appt.id}`}
          className="inline-flex min-h-touch items-center gap-1 text-sm text-primary hover:underline"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Chi tiết lịch hẹn
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Phiếu khám · {appt.pet?.name ?? 'Thú cưng'}
        </h1>
        <p className="text-data text-muted">
          {formatDateTime(appt.startAt)} · {appt.doctor?.fullName ?? 'Chưa gán bác sĩ'} ·{' '}
          {appt.service?.item.itemName ?? 'Chưa chọn dịch vụ'}
        </p>
      </div>

      {recordQuery.isError ? (
        <OpenRecordError error={recordQuery.error} />
      ) : recordQuery.data ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
          {/*
            Thứ tự trong DOM = thứ tự đọc khi xếp chồng: bệnh nhân, phiếu khám, bệnh sử.
            Đây cũng là thứ tự bác sĩ cần trên máy tính bảng, nên không cần đảo bằng
            `order-*` - đảo thứ tự thị giác so với DOM là bẫy cho người đi bằng bàn phím.
          */}
          <PatientSummaryPanel appointment={appt} />
          <CurrentVisitPanel record={recordQuery.data} appointmentId={appt.id} appt={appt} />
          <PetHistoryPanel petId={appt.petId} currentRecordId={recordQuery.data.id} />
        </div>
      ) : (
        <QueryErrorState
          error={recordQuery.error}
          title="Không mở được hồ sơ bệnh án"
          onRetry={() => void recordQuery.refetch()}
        />
      )}
    </div>
  );
}
