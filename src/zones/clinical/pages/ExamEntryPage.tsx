import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { formatDateTime } from '@/utils/format';
import { CurrentVisitPanel } from '../exam-entry/CurrentVisitPanel';
import { OpenRecordError } from '../exam-entry/OpenRecordError';
import { PetHistoryPanel } from '../exam-entry/PetHistoryPanel';

/**
 * Màn hình khám bệnh — UC-03.
 *
 * Bố cục 2 cột theo đúng FR-07 (*"Bác sĩ có thể xem các lần khám trước"*): cột trái là
 * bệnh sử các lần trước, cột phải là form nhập của lần này. Bác sĩ cần nhìn lần khám
 * trước **trong lúc** khám, không phải mở tab khác rồi nhớ lại.
 *
 * Trang này chỉ LẮP RÁP: mỗi khối của cột phải (hành chính, sinh hiệu, chẩn đoán, điều
 * trị, xét nghiệm, tiêm chủng, đơn thuốc, hoàn tất, tái khám) là một component độc lập
 * trong `../exam-entry/` — tự có state, truy vấn và mutation riêng, không như các bước
 * của một wizard. Trước đây tất cả nằm chung một file 1644 dòng.
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
    return <p className="text-muted">Đang tải…</p>;
  }
  if (!apptQuery.data) {
    return <p className="text-destructive">Không tìm thấy lịch hẹn.</p>;
  }
  const appt = apptQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Khám bệnh — {appt.pet?.name ?? 'Thú cưng'}</h1>
        <p className="text-muted">
          {formatDateTime(appt.startAt)} · BS. {appt.doctor?.fullName ?? '—'} ·{' '}
          {appt.service?.item.itemName ?? '—'}
        </p>
        <Link
          to={`/staff/appointments/${appt.id}`}
          className="text-sm text-primary hover:underline"
        >
          ← Quay lại chi tiết lịch hẹn
        </Link>
      </div>

      {recordQuery.isError ? (
        <OpenRecordError error={recordQuery.error} />
      ) : recordQuery.data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <PetHistoryPanel petId={appt.petId} currentRecordId={recordQuery.data.id} />
          <CurrentVisitPanel record={recordQuery.data} appointmentId={appt.id} appt={appt} />
        </div>
      ) : (
        <p className="text-destructive">Không thể mở hồ sơ bệnh án.</p>
      )}
    </div>
  );
}
