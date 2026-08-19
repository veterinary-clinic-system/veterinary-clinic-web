import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentsApi } from '@/api/appointments.api';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  ErrorState,
  Icon,
  Skeleton,
  SkeletonText,
  Timeline,
  TimelineEntry,
  TriageBadge,
} from '@/components/basic';
import { AppointmentStatus, COMMON_SYMPTOM_LABEL_VI } from '@/types/enums';
import { Appointment } from '@/types/models';
import { APPOINTMENT_STATUS_TONE, canCancel } from '@/utils/appointment-status';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { APPOINTMENT_STATUS_LABEL_VI } from '@/utils/labels';
import { CancelAppointmentDialog } from '../components/CancelAppointmentDialog';

/**
 * Vòng đời của một lịch hẹn, dựng từ những gì bản ghi thật sự biết.
 *
 * Chỉ ba mốc có dấu thời gian đáng tin: lúc đặt (`startAt` là giờ hẹn, không phải giờ
 * đặt - nên mốc đầu ghi là "giờ hẹn"), lúc kết thúc dự kiến, và lúc huỷ nếu có. Không
 * bịa thêm mốc "đã xác nhận lúc..." khi API không trả về thời điểm đó: một dòng thời
 * gian có mốc sai còn tệ hơn một dòng thời gian ngắn.
 */
function buildTimeline(appointment: Appointment): TimelineEntry[] {
  const status = appointment.status as AppointmentStatus;

  const entries: TimelineEntry[] = [
    {
      id: 'scheduled',
      time: formatDateTime(appointment.startAt),
      title: 'Giờ hẹn khám',
      description: appointment.service?.item.itemName,
      tone: 'default',
    },
    {
      id: 'expected-end',
      time: formatDateTime(appointment.endAt),
      title: 'Dự kiến kết thúc',
      tone: 'muted',
    },
  ];

  if (appointment.cancelledAt) {
    entries.push({
      id: 'cancelled',
      time: formatDateTime(appointment.cancelledAt),
      title: status === AppointmentStatus.NO_SHOW ? 'Ghi nhận không đến' : 'Lịch hẹn đã huỷ',
      description: (
        <>
          {appointment.cancelledBy?.fullName && <p>Thực hiện bởi: {appointment.cancelledBy.fullName}</p>}
          {appointment.cancelReason && <p className="mt-1">Lý do: {appointment.cancelReason}</p>}
        </>
      ),
      tone: 'danger',
    });
  } else if (status === AppointmentStatus.COMPLETED) {
    entries.push({
      id: 'completed',
      time: formatDateTime(appointment.endAt),
      title: 'Buổi khám đã hoàn tất',
      description: 'Chẩn đoán và đơn thuốc đã được lưu vào hồ sơ của bé.',
      tone: 'success',
    });
  }

  return entries;
}

/**
 * Chi tiết một lịch hẹn của CHÍNH chủ nuôi. Dùng `GET /appointments/:id` - route đó
 * không gắn `@RequirePermissions` mà tự kiểm tra quyền sở hữu trong service
 * (`findOneForOwner`), nên lịch của người khác trả về 403 chứ không lộ dữ liệu.
 *
 * Hành động thay đổi theo trạng thái (mục 20 của đặc tả). Ba hành động khả thi với API
 * hiện có: **huỷ** (còn PENDING/CONFIRMED), **đặt lại** (sau khi đã huỷ hoặc đã khám
 * xong - dẫn sang biểu mẫu đặt lịch với bé đã chọn sẵn), và **gọi chi nhánh**. "Đổi
 * lịch" chưa có cửa API tương ứng, nên không dựng một nút hứa hẹn điều đó.
 */
export function MyAppointmentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);

  const {
    data: appointment,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentsApi.getOne(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-10 w-2/3" />
        <SkeletonText lines={8} className="mt-6" />
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState
          title="Không xem được lịch hẹn này"
          description={getErrorMessage(
            error,
            'Lịch hẹn không tồn tại, hoặc không thuộc về tài khoản của bạn.',
          )}
          onRetry={() => void refetch()}
        />
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/my/appointments')}>
          Về danh sách lịch hẹn
        </Button>
      </div>
    );
  }

  const status = appointment.status as AppointmentStatus;
  const cancellable = canCancel(status);
  const rebookable = !cancellable;
  const summary = `${formatDateTime(appointment.startAt)} · ${appointment.service?.item.itemName ?? 'Khám thú y'}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/my/appointments"
        className="inline-flex min-h-touch items-center gap-1 text-sm text-primary hover:underline"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Lịch hẹn của tôi
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {format(parseISO(appointment.startAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {appointment.service?.item.itemName ?? 'Khám thú y'}
            {appointment.pet?.name && ` · ${appointment.pet.name}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={APPOINTMENT_STATUS_TONE[status] ?? 'neutral'}>
            {APPOINTMENT_STATUS_LABEL_VI[status]}
          </Badge>
          {appointment.priorityColor && <TriageBadge color={appointment.priorityColor} />}
        </div>
      </div>

      {/*
        Hành động đặt NGAY DƯỚI tiêu đề, không ở cuối trang: người mở trang này thường đã
        biết mình muốn làm gì (huỷ, hoặc đặt lại), và bắt họ cuộn qua ba khối thông tin
        để tìm nút là bắt họ đọc lại thứ họ vừa đọc.
      */}
      <div className="mt-5 flex flex-wrap gap-2">
        {cancellable && (
          <Button variant="secondary" onClick={() => setCancelOpen(true)}>
            <Icon name="close" className="h-4 w-4" />
            Huỷ lịch hẹn
          </Button>
        )}
        {rebookable && (
          <Button
            onClick={() => navigate('/booking', { state: { petId: appointment.petId } })}
          >
            <Icon name="calendar" className="h-4 w-4" />
            Đặt lịch mới cho bé này
          </Button>
        )}
        {appointment.branch?.phone && (
          <a
            href={`tel:${appointment.branch.phone.replace(/\s/g, '')}`}
            className="inline-flex min-h-touch items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-surface-muted"
          >
            <Icon name="phone" className="h-4 w-4" />
            Gọi chi nhánh
          </a>
        )}
      </div>

      {appointment.cancelledAt && (
        <Alert
          tone="danger"
          title={status === AppointmentStatus.NO_SHOW ? 'Ghi nhận không đến' : 'Lịch hẹn đã huỷ'}
          className="mt-5"
        >
          {appointment.cancelReason ?? 'Không có lý do được ghi lại.'}
        </Alert>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Thông tin buổi khám</CardTitle>
            </CardHeader>
            <CardBody>
              <DescriptionList
                items={[
                  { label: 'Chi nhánh', value: appointment.branch?.branchName },
                  { label: 'Địa chỉ', value: appointment.branch?.address, wide: true },
                  {
                    label: 'Bác sĩ',
                    value: appointment.doctor?.fullName ?? 'Phòng khám sắp xếp',
                  },
                  {
                    label: 'Dịch vụ',
                    value: appointment.service?.item.itemName,
                  },
                  {
                    label: 'Giá tham khảo',
                    value:
                      appointment.service?.item.unitPrice !== undefined
                        ? formatCurrency(appointment.service.item.unitPrice)
                        : null,
                  },
                  { label: 'Kết thúc dự kiến', value: formatDateTime(appointment.endAt) },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Thú cưng</CardTitle>
              {appointment.petId && (
                <Link
                  to={`/my/pets/${appointment.petId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Xem hồ sơ
                </Link>
              )}
            </CardHeader>
            <CardBody>
              <DescriptionList
                items={[
                  { label: 'Tên', value: appointment.pet?.name },
                  { label: 'Giống', value: appointment.pet?.breed?.breedName },
                  { label: 'Loài', value: appointment.pet?.breed?.species?.speciesName },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Triệu chứng đã khai</CardTitle>
            </CardHeader>
            <CardBody>
              {appointment.commonSymptoms.length === 0 &&
              !appointment.otherSymptoms &&
              appointment.photoUrls.length === 0 ? (
                <p className="text-sm text-muted">Không có mô tả triệu chứng.</p>
              ) : (
                <>
                  {appointment.commonSymptoms.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5">
                      {appointment.commonSymptoms.map((symptom) => (
                        <li key={symptom}>
                          <Badge variant="outline">{COMMON_SYMPTOM_LABEL_VI[symptom]}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                  {appointment.otherSymptoms && (
                    <p className="mt-3 whitespace-pre-line text-sm text-foreground">
                      {appointment.otherSymptoms}
                    </p>
                  )}
                  {appointment.photoUrls.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-3">
                      {appointment.photoUrls.map((url, index) => (
                        <li key={url}>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={`Ảnh triệu chứng ${index + 1}`}
                              loading="lazy"
                              className="h-24 w-24 rounded-lg border border-border object-cover"
                            />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>

        <Card as="section" className="h-fit">
          <CardHeader>
            <CardTitle as="h2">Diễn biến</CardTitle>
          </CardHeader>
          <CardBody>
            <Timeline entries={buildTimeline(appointment)} />
          </CardBody>
        </Card>
      </div>

      <CancelAppointmentDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        appointmentId={appointment.id}
        summary={summary}
      />
    </div>
  );
}
