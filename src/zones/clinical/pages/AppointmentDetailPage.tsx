import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi } from '@/api/appointments.api';
import { prescreeningApi } from '@/api/prescreening.api';
import { Skeleton, SkeletonText } from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { billingApi } from '@/api/billing.api';
import {
  AppointmentStatus,
  COMMON_SYMPTOM_LABEL_VI,
  PRIORITY_COLOR_LABEL_VI,
  PriorityColor,
  Role,
} from '@/types/enums';
import { formatDateTime } from '@/utils/format';
import { APPOINTMENT_STATUS_LABEL_VI, triageColorClasses } from '@/utils/labels';

/** Intake/triage detail + hub for one appointment: AI prescreening, overrides, actions, invoice. */
export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const apptQuery = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsApi.getOne(id!),
    enabled: !!id,
  });
  const appt = apptQuery.data;

  const prescreeningQuery = useQuery({
    queryKey: ['prescreening', id],
    queryFn: () => prescreeningApi.getForAppointment(id!),
    enabled: !!id,
    retry: false,
  });
  const prescreeningNotFound =
    prescreeningQuery.isError &&
    (prescreeningQuery.error as AxiosError)?.response?.status === 404;

  const rerunMutation = useMutation({
    mutationFn: () => prescreeningApi.rerun(id!),
    onSuccess: (data) => queryClient.setQueryData(['prescreening', id], data),
  });

  const invoiceQuery = useQuery({
    queryKey: ['invoice-by-appointment', id],
    queryFn: () => billingApi.getByAppointment(id!),
    enabled: !!id,
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: () => billingApi.generate(id!),
    onSuccess: (invoice) => queryClient.setQueryData(['invoice-by-appointment', id], invoice),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => appointmentsApi.cancel(id!, reason),
    onSuccess: (updated) => queryClient.setQueryData(['appointment', id], updated),
  });

  const noShowMutation = useMutation({
    mutationFn: (reason: string) => appointmentsApi.markNoShow(id!, reason || undefined),
    onSuccess: (updated) => queryClient.setQueryData(['appointment', id], updated),
  });

  /** null = hộp thoại đóng. FR-05-04 bắt buộc có lý do nên phải hỏi, không confirm() suông. */
  const [endDialog, setEndDialog] = useState<'cancel' | 'no-show' | null>(null);
  const [endReason, setEndReason] = useState('');

  const [formPriority, setFormPriority] = useState<PriorityColor | ''>('');
  const [formStatus, setFormStatus] = useState<AppointmentStatus | ''>('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    if (appt) {
      setFormPriority(appt.priorityColor ?? '');
      setFormStatus(appt.status);
      setFormNotes(appt.notes ?? '');
    }
  }, [appt]);

  const updateMutation = useMutation({
    mutationFn: () =>
      appointmentsApi.update(id!, {
        priorityColor: formPriority || undefined,
        status: (formStatus || undefined) as AppointmentStatus | undefined,
        notes: formNotes,
      }),
    onSuccess: (updated) => queryClient.setQueryData(['appointment', id], updated),
  });

  if (apptQuery.isLoading) {
    return (
      <div className="flex flex-col gap-stack">
        <Skeleton className="h-12 w-2/3" />
        <SkeletonText lines={6} />
      </div>
    );
  }

  if (!appt) {
    return (
      <QueryErrorState
        error={apptQuery.error}
        title="Không tìm thấy lịch hẹn"
        description="Lịch hẹn có thể đã bị huỷ, hoặc mã trong đường dẫn không đúng."
        onRetry={() => void apptQuery.refetch()}
      />
    );
  }

  const canOverride = user?.role === Role.RECEPTIONIST || user?.role === Role.DOCTOR || user?.role === Role.ADMIN;
  const canManageBilling = user?.role === Role.RECEPTIONIST || user?.role === Role.ADMIN;

  const isFinished =
    appt.status === AppointmentStatus.COMPLETED ||
    appt.status === AppointmentStatus.CANCELLED ||
    appt.status === AppointmentStatus.NO_SHOW;
  const isCheckedIn =
    appt.status === AppointmentStatus.CHECKED_IN || appt.status === AppointmentStatus.IN_PROGRESS;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Lịch hẹn — {appt.pet?.name ?? 'Thú cưng'}
          </h1>
          <p className="text-muted">{formatDateTime(appt.startAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/*
            BR-06: phiếu khám chỉ ghi được sau khi thú cưng đã được tiếp nhận. Backend
            chặn ở `ExaminationsService.create`; ở đây nói trước cho bác sĩ biết thay vì
            để họ gõ xong cả phiếu rồi mới nhận lỗi.
          */}
          {user?.role === Role.DOCTOR && !isFinished && (
            isCheckedIn ? (
              <Link
                to={`/staff/appointments/${appt.id}/exam`}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Bắt đầu khám
              </Link>
            ) : (
              <span
                className="rounded border border-border px-4 py-2 text-sm text-muted"
                title="BR-06: lễ tân phải check-in thú cưng trước khi ghi phiếu khám."
              >
                Chờ lễ tân check-in
              </span>
            )
          )}
          {!isFinished && (
            <button
              type="button"
              onClick={() => {
                setEndReason('');
                setEndDialog('cancel');
              }}
              className="rounded border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              Hủy lịch hẹn
            </button>
          )}
          {/*
            FR-06-03: "khách không đến" là thao tác riêng, chỉ có nghĩa khi khách CHƯA
            được tiếp nhận. Khách đã check-in rồi bỏ về là chuyện khác - hủy lượt chờ ở
            màn hình hàng chờ. Backend chặn luôn trường hợp này nên nút ẩn cho khớp.
          */}
          {!isFinished && !isCheckedIn && (
            <button
              type="button"
              onClick={() => {
                setEndReason('');
                setEndDialog('no-show');
              }}
              className="rounded border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              Khách không đến
            </button>
          )}
        </div>
      </div>

      {/* Khối lưu vết kết thúc bất thường - FR-05-04. */}
      {appt.cancelledAt && (
        <section className="rounded border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">
            {appt.status === AppointmentStatus.NO_SHOW
              ? 'Khách không đến'
              : 'Lịch hẹn đã bị hủy'}
          </p>
          <p className="mt-1">
            Bởi <strong>{appt.cancelledBy?.fullName ?? 'không rõ'}</strong> lúc{' '}
            {formatDateTime(appt.cancelledAt)}
          </p>
          <p className="mt-0.5 text-muted">Lý do: {appt.cancelReason ?? '—'}</p>
        </section>
      )}

      {endDialog && (
        <EndAppointmentDialog
          mode={endDialog}
          reason={endReason}
          onReasonChange={setEndReason}
          pending={cancelMutation.isPending || noShowMutation.isPending}
          error={
            cancelMutation.isError || noShowMutation.isError
              ? 'Không thực hiện được - vui lòng kiểm tra lại lý do và trạng thái lịch hẹn.'
              : null
          }
          onClose={() => setEndDialog(null)}
          onConfirm={() => {
            const done = () => setEndDialog(null);
            if (endDialog === 'cancel') {
              cancelMutation.mutate(endReason.trim(), { onSuccess: done });
            } else {
              noShowMutation.mutate(endReason.trim(), { onSuccess: done });
            }
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">Thông tin lịch hẹn</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted">Thú cưng</dt>
            <dd>
              <Link to={`/staff/patients/${appt.petId}`} className="text-primary hover:underline">
                {appt.pet?.name ?? '—'}
              </Link>
            </dd>
            <dt className="text-muted">Chủ nuôi</dt>
            <dd>
              {appt.pet?.owner?.fullName ?? '—'} · {appt.pet?.owner?.phone ?? '—'}
            </dd>
            <dt className="text-muted">Bác sĩ</dt>
            <dd>{appt.doctor?.fullName ?? '—'}</dd>
            <dt className="text-muted">Chi nhánh</dt>
            <dd>{appt.branch?.branchName ?? '—'}</dd>
            <dt className="text-muted">Dịch vụ</dt>
            <dd>{appt.service?.item.itemName ?? '—'}</dd>
            <dt className="text-muted">Trạng thái</dt>
            <dd>{APPOINTMENT_STATUS_LABEL_VI[appt.status]}</dd>
            <dt className="text-muted">Mức độ ưu tiên</dt>
            <dd>
              {appt.priorityColor ? (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${triageColorClasses(appt.priorityColor)}`}>
                  {PRIORITY_COLOR_LABEL_VI[appt.priorityColor]}
                </span>
              ) : (
                '—'
              )}
            </dd>
            <dt className="text-muted">Địa chỉ</dt>
            <dd>{appt.address ?? '—'}</dd>
          </dl>
        </section>

        <section className="rounded border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">Triệu chứng</h2>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {appt.commonSymptoms.length === 0 && <span className="text-sm text-muted">Không có triệu chứng phổ biến được chọn.</span>}
            {appt.commonSymptoms.map((s) => (
              <span key={s} className="rounded-full bg-surface-muted px-2 py-0.5 text-xs">
                {COMMON_SYMPTOM_LABEL_VI[s]}
              </span>
            ))}
          </div>
          <p className="text-sm">
            {/* FR-05-01 `Reason` - xem ghi chú ánh xạ trong appointment.entity.ts. */}
            <span className="text-muted">Lý do khám / triệu chứng: </span>
            {appt.otherSymptoms ?? '—'}
          </p>
          {appt.photoUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {appt.photoUrls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="Ảnh triệu chứng" className="h-20 w-full rounded object-cover" />
                </a>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium">Kết quả tiền sàng lọc AI</h2>
        {prescreeningQuery.isLoading ? (
          <SkeletonText lines={3} />
        ) : prescreeningNotFound ? (
          <div className="flex items-center justify-between">
            <p className="text-muted">Chưa có kết quả AI cho lịch hẹn này.</p>
            <button
              type="button"
              disabled={rerunMutation.isPending}
              onClick={() => rerunMutation.mutate()}
              className="rounded border border-border px-4 py-2 text-sm hover:bg-surface-muted disabled:opacity-50"
            >
              {rerunMutation.isPending ? 'Đang chạy…' : 'Chạy phân tích AI'}
            </button>
          </div>
        ) : prescreeningQuery.isError ? (
          <p className="text-destructive">Không thể tải kết quả AI.</p>
        ) : prescreeningQuery.data ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted">Nhóm bệnh nghi ngờ (AI)</p>
                <p>
                  {prescreeningQuery.data.aiSuspectedDiseaseGroups.length > 0
                    ? prescreeningQuery.data.aiSuspectedDiseaseGroups.map((g) => g.diseaseName).join(', ')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Mức độ ưu tiên (AI)</p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${triageColorClasses(prescreeningQuery.data.aiPriorityColor)}`}
                >
                  {PRIORITY_COLOR_LABEL_VI[prescreeningQuery.data.aiPriorityColor]}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted">Từ khóa triệu chứng</p>
                <p>{prescreeningQuery.data.extractedSymptomKeywords.join(', ') || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Độ tin cậy (NLP / CV / Tổng thể)</p>
                <p>
                  {prescreeningQuery.data.nlpConfidence != null ? `${Math.round(prescreeningQuery.data.nlpConfidence * 100)}%` : '—'} /{' '}
                  {prescreeningQuery.data.cvConfidence != null ? `${Math.round(prescreeningQuery.data.cvConfidence * 100)}%` : '—'} /{' '}
                  {Math.round(prescreeningQuery.data.overallConfidence * 100)}%
                </p>
              </div>
            </div>
            <div>
              <button
                type="button"
                disabled={rerunMutation.isPending}
                onClick={() => rerunMutation.mutate()}
                className="rounded border border-border px-4 py-2 text-sm hover:bg-surface-muted disabled:opacity-50"
              >
                {rerunMutation.isPending ? 'Đang chạy…' : 'Chạy lại phân tích AI'}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {canOverride && (
        <section className="rounded border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">Điều chỉnh mức độ ưu tiên / trạng thái</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
            className="flex flex-wrap items-end gap-4"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Mức độ ưu tiên</span>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as PriorityColor | '')}
                className="rounded border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="">— Chưa đặt —</option>
                {Object.values(PriorityColor).map((c) => (
                  <option key={c} value={c}>
                    {PRIORITY_COLOR_LABEL_VI[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Trạng thái</span>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AppointmentStatus)}
                className="rounded border border-border bg-surface px-3 py-2 text-sm"
              >
                {/*
                  Hủy và "không đến" cố tình KHÔNG có trong danh sách này: hai việc đó
                  phải ghi lý do (FR-05-04) nên đi qua nút riêng ở đầu trang, và backend
                  từ chối thẳng nếu PATCH cố đặt hai trạng thái này.
                */}
                {Object.values(AppointmentStatus)
                  .filter(
                    (s) => s !== AppointmentStatus.CANCELLED && s !== AppointmentStatus.NO_SHOW,
                  )
                  .map((s) => (
                    <option key={s} value={s}>
                      {APPOINTMENT_STATUS_LABEL_VI[s]}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
              {/* FR-05-01 `Note` - ghi chú nội bộ, khách không đọc. */}
              <span className="text-muted">Ghi chú nội bộ</span>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="rounded border border-border bg-surface px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
            {updateMutation.isSuccess && <span className="text-sm text-success">Đã lưu.</span>}
          </form>
        </section>
      )}

      <section className="rounded border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium">Hóa đơn</h2>
        {invoiceQuery.isLoading ? (
          <SkeletonText lines={1} />
        ) : invoiceQuery.data ? (
          <Link to={`/staff/billing/${invoiceQuery.data.id}`} className="text-primary hover:underline">
            Xem hóa đơn ({invoiceQuery.data.paid ? 'đã thanh toán' : 'chưa thanh toán'})
          </Link>
        ) : canManageBilling ? (
          <button
            type="button"
            disabled={generateInvoiceMutation.isPending}
            onClick={() => generateInvoiceMutation.mutate()}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {generateInvoiceMutation.isPending ? 'Đang tạo…' : 'Tạo hóa đơn'}
          </button>
        ) : (
          <p className="text-muted">Chưa có hóa đơn cho lịch hẹn này.</p>
        )}
      </section>
    </div>
  );
}

/**
 * Hộp thoại kết thúc bất thường một lịch hẹn.
 *
 * Hai chế độ khác nhau ở chỗ lý do có bắt buộc hay không: hủy lịch là quyết định phải
 * giải trình được (FR-05-04 → backend trả 400 nếu thiếu), còn "khách không đến" chỉ là
 * ghi nhận một sự việc nên để trống được, backend tự điền "Khách không đến".
 */
function EndAppointmentDialog({
  mode,
  reason,
  onReasonChange,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  mode: 'cancel' | 'no-show';
  reason: string;
  onReasonChange: (value: string) => void;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isCancel = mode === 'cancel';
  const reasonTooShort = isCancel && reason.trim().length < 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">
          {isCancel ? 'Hủy lịch hẹn' : 'Đánh dấu khách không đến'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isCancel
            ? 'Lý do hủy được lưu lại kèm người thực hiện và thời điểm.'
            : 'Chỉ dùng khi khách chưa được tiếp nhận. Khách đã check-in rồi bỏ về thì hủy lượt chờ ở màn hình hàng chờ.'}
        </p>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="text-muted">{isCancel ? 'Lý do hủy *' : 'Ghi chú (tùy chọn)'}</span>
          <textarea
            autoFocus
            rows={3}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={isCancel ? 'Ví dụ: khách báo bận, xin dời sang tuần sau' : 'Khách không đến'}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border px-4 py-2 text-sm hover:bg-surface-muted"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={pending || reasonTooShort}
            onClick={onConfirm}
            className="rounded bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
          >
            {pending ? 'Đang xử lý…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
