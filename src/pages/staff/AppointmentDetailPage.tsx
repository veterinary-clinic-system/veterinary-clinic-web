import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi } from '@/api/appointments.api';
import { prescreeningApi } from '@/api/prescreening.api';
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
    mutationFn: () => appointmentsApi.cancel(id!),
    onSuccess: (updated) => queryClient.setQueryData(['appointment', id], updated),
  });

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
    return <p className="text-muted">Đang tải lịch hẹn…</p>;
  }
  if (!appt) {
    return <p className="text-destructive">Không tìm thấy lịch hẹn.</p>;
  }

  const canOverride = user?.role === Role.RECEPTIONIST || user?.role === Role.DOCTOR || user?.role === Role.ADMIN;
  const canManageBilling = user?.role === Role.RECEPTIONIST || user?.role === Role.ADMIN;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Lịch hẹn — {appt.pet?.name ?? 'Thú cưng'}
          </h1>
          <p className="text-muted">{formatDateTime(appt.startAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.role === Role.DOCTOR && appt.status !== AppointmentStatus.CANCELLED && (
            <Link
              to={`/staff/appointments/${appt.id}/exam`}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Bắt đầu khám
            </Link>
          )}
          {appt.status !== AppointmentStatus.CANCELLED && appt.status !== AppointmentStatus.COMPLETED && (
            <button
              type="button"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (window.confirm('Xác nhận hủy lịch hẹn này?')) {
                  cancelMutation.mutate();
                }
              }}
              className="rounded border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Hủy lịch hẹn
            </button>
          )}
        </div>
      </div>

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
            <span className="text-muted">Triệu chứng khác: </span>
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
          <p className="text-muted">Đang tải…</p>
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
                {Object.values(AppointmentStatus).map((s) => (
                  <option key={s} value={s}>
                    {APPOINTMENT_STATUS_LABEL_VI[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
              <span className="text-muted">Ghi chú</span>
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
            {updateMutation.isSuccess && <span className="text-sm text-triage-green">Đã lưu.</span>}
          </form>
        </section>
      )}

      <section className="rounded border border-border bg-surface p-4">
        <h2 className="mb-3 font-medium">Hóa đơn</h2>
        {invoiceQuery.isLoading ? (
          <p className="text-muted">Đang tải…</p>
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
