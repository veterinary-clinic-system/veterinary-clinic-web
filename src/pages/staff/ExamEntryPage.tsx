import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { appointmentsApi } from '@/api/appointments.api';
import { examinationsApi } from '@/api/examinations.api';
import { catalogApi } from '@/api/catalog.api';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi } from '@/api/doctors.api';
import { filesApi } from '@/api/files.api';
import { LabTestOrder, Medication, Prescription } from '@/types/models';
import { LabTestStatus } from '@/types/enums';
import { formatDateTime } from '@/utils/format';
import { LAB_TEST_STATUS_LABEL_VI } from '@/utils/labels';

interface ExamFormValues {
  diseaseGroups: string;
  diagnosisText: string;
  notes: string;
  temperatureCelsius: string;
  weightKg: string;
  heartRateBpm: string;
  respiratoryRateBpm: string;
}

function toOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/** Doctor exam-recording form: vitals/diagnosis, prescriptions, lab tests, attachments, follow-up. */
export function ExamEntryPage() {
  const { id } = useParams<{ id: string }>();

  const apptQuery = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsApi.getOne(id!),
    enabled: !!id,
  });

  const examQuery = useQuery({
    queryKey: ['examination-by-appointment', id],
    queryFn: () => examinationsApi.getByAppointment(id!),
    enabled: !!id,
    retry: false,
  });
  const examNotFound = examQuery.isError && (examQuery.error as AxiosError)?.response?.status === 404;

  if (apptQuery.isLoading || examQuery.isLoading) {
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
          {formatDateTime(appt.startAt)} · BS. {appt.doctor?.fullName ?? '—'} · {appt.service?.item.itemName ?? '—'}
        </p>
        <Link to={`/staff/appointments/${appt.id}`} className="text-sm text-primary hover:underline">
          ← Quay lại chi tiết lịch hẹn
        </Link>
      </div>

      {examNotFound ? (
        <CreateExamForm appointmentId={appt.id} />
      ) : examQuery.data ? (
        <ExaminationWorkspace examination={examQuery.data} appointmentId={appt.id} appt={appt} />
      ) : (
        <p className="text-destructive">Không thể tải phiếu khám.</p>
      )}
    </div>
  );
}

function CreateExamForm({ appointmentId }: { appointmentId: string }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<ExamFormValues>({
    defaultValues: {
      diseaseGroups: '',
      diagnosisText: '',
      notes: '',
      temperatureCelsius: '',
      weightKg: '',
      heartRateBpm: '',
      respiratoryRateBpm: '',
    },
  });
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: (values: ExamFormValues) =>
      examinationsApi.create({
        appointmentId,
        diseaseGroups: values.diseaseGroups
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        diagnosisText: values.diagnosisText || undefined,
        notes: values.notes || undefined,
        temperatureCelsius: toOptionalNumber(values.temperatureCelsius),
        weightKg: toOptionalNumber(values.weightKg),
        heartRateBpm: toOptionalNumber(values.heartRateBpm),
        respiratoryRateBpm: toOptionalNumber(values.respiratoryRateBpm),
        attachmentUrls,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['examination-by-appointment', appointmentId] });
    },
  });

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const res = await filesApi.upload('exam-attachments', file);
        uploaded.push(res.url);
      }
      setAttachmentUrls((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit((values) => createMutation.mutate(values))}
      className="flex flex-col gap-4 rounded border border-border bg-surface p-4"
    >
      <h2 className="font-medium">Tạo phiếu khám</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Nhóm bệnh (phân cách bằng dấu phẩy)</span>
          <input {...register('diseaseGroups')} className="rounded border border-border bg-surface px-3 py-2 text-sm" placeholder="Ví dụ: Da liễu, Tiêu hóa" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Chẩn đoán</span>
          <input {...register('diagnosisText')} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Nhiệt độ (°C)</span>
          <input type="number" step="0.1" {...register('temperatureCelsius')} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Cân nặng (kg)</span>
          <input type="number" step="0.1" {...register('weightKg')} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Nhịp tim (lần/phút)</span>
          <input type="number" {...register('heartRateBpm')} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Nhịp thở (lần/phút)</span>
          <input type="number" {...register('respiratoryRateBpm')} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Ghi chú</span>
        <textarea {...register('notes')} rows={3} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
      </label>

      <div className="flex flex-col gap-2 text-sm">
        <span className="text-muted">Ảnh/tệp đính kèm</span>
        <input type="file" multiple onChange={(e) => void handleFilesSelected(e.target.files)} className="text-sm" />
        {uploading && <span className="text-muted">Đang tải lên…</span>}
        {attachmentUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachmentUrls.map((url) => (
              <img key={url} src={url} alt="Tệp đính kèm" className="h-16 w-16 rounded object-cover" />
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="w-fit rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {createMutation.isPending ? 'Đang lưu…' : 'Lưu phiếu khám'}
      </button>
      {createMutation.isError && <p className="text-sm text-destructive">Có lỗi xảy ra, vui lòng thử lại.</p>}
    </form>
  );
}

interface ExaminationWorkspaceProps {
  examination: { id: string; diseaseGroups: string[]; diagnosisText: string | null; notes: string | null; temperatureCelsius: number | null; weightKg: number | null; heartRateBpm: number | null; respiratoryRateBpm: number | null; attachmentUrls: string[]; examinedAt: string };
  appointmentId: string;
  appt: { doctorId: string; branchId: string; serviceId: string };
}

function ExaminationWorkspace({ examination, appointmentId, appt }: ExaminationWorkspaceProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Phiếu khám</h2>
          <DownloadPdfButton examinationId={examination.id} />
        </div>
        <dl className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
          <dt className="text-muted">Nhóm bệnh</dt>
          <dd className="col-span-3">{examination.diseaseGroups.join(', ') || '—'}</dd>
          <dt className="text-muted">Chẩn đoán</dt>
          <dd className="col-span-3">{examination.diagnosisText ?? '—'}</dd>
          <dt className="text-muted">Nhiệt độ</dt>
          <dd>{examination.temperatureCelsius != null ? `${examination.temperatureCelsius} °C` : '—'}</dd>
          <dt className="text-muted">Cân nặng</dt>
          <dd>{examination.weightKg != null ? `${examination.weightKg} kg` : '—'}</dd>
          <dt className="text-muted">Nhịp tim</dt>
          <dd>{examination.heartRateBpm != null ? `${examination.heartRateBpm} bpm` : '—'}</dd>
          <dt className="text-muted">Nhịp thở</dt>
          <dd>{examination.respiratoryRateBpm != null ? `${examination.respiratoryRateBpm} bpm` : '—'}</dd>
          <dt className="text-muted">Ghi chú</dt>
          <dd className="col-span-3">{examination.notes ?? '—'}</dd>
        </dl>
        {examination.attachmentUrls.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {examination.attachmentUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="Tệp đính kèm" className="h-16 w-16 rounded object-cover" />
              </a>
            ))}
          </div>
        )}
      </section>

      <PrescriptionSection examinationId={examination.id} />
      <LabTestsSection examinationId={examination.id} />
      <FollowUpSection appointmentId={appointmentId} appt={appt} />
    </div>
  );
}

function DownloadPdfButton({ examinationId }: { examinationId: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await examinationsApi.downloadPdf(examinationId);
        } finally {
          setLoading(false);
        }
      }}
      className="rounded border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-50"
    >
      {loading ? 'Đang xuất…' : 'Xuất PDF'}
    </button>
  );
}

interface PrescriptionLine {
  medicationId: string;
  dosage: string;
  durationDays: string;
  instructions: string;
}

const EMPTY_LINE: PrescriptionLine = { medicationId: '', dosage: '', durationDays: '', instructions: '' };

function PrescriptionSection({ examinationId }: { examinationId: string }) {
  const medicationsQuery = useQuery({
    queryKey: ['medications', 'for-prescription'],
    queryFn: () => catalogApi.medications({ limit: 100 }),
  });
  const medications: Medication[] = medicationsQuery.data?.data ?? [];

  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PrescriptionLine[]>([{ ...EMPTY_LINE }]);
  const [saved, setSaved] = useState<Prescription[]>([]);

  const addMutation = useMutation({
    mutationFn: () =>
      examinationsApi.addPrescription(examinationId, {
        notes: notes || undefined,
        items: lines
          .filter((l) => l.medicationId)
          .map((l) => ({
            medicationId: l.medicationId,
            dosage: l.dosage,
            durationDays: Number(l.durationDays) || 0,
            instructions: l.instructions || undefined,
          })),
      }),
    onSuccess: (prescription) => {
      setSaved((prev) => [...prev, prescription]);
      setLines([{ ...EMPTY_LINE }]);
      setNotes('');
    },
  });

  return (
    <section className="rounded border border-border bg-surface p-4">
      <h2 className="mb-3 font-medium">Kê đơn thuốc</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addMutation.mutate();
        }}
        className="flex flex-col gap-3"
      >
        {lines.map((line, idx) => (
          <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_2fr]">
            <select
              value={line.medicationId}
              onChange={(e) => {
                const v = e.target.value;
                setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, medicationId: v } : l)));
              }}
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">— Chọn thuốc —</option>
              {medications.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.item.itemName} ({m.unit})
                </option>
              ))}
            </select>
            <input
              placeholder="Liều dùng"
              value={line.dosage}
              onChange={(e) => {
                const v = e.target.value;
                setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, dosage: v } : l)));
              }}
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Số ngày"
              value={line.durationDays}
              onChange={(e) => {
                const v = e.target.value;
                setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, durationDays: v } : l)));
              }}
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
            />
            <input
              placeholder="Hướng dẫn sử dụng (tùy chọn)"
              value={line.instructions}
              onChange={(e) => {
                const v = e.target.value;
                setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, instructions: v } : l)));
              }}
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE }])}
          className="w-fit rounded border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
        >
          + Thêm thuốc
        </button>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Ghi chú đơn thuốc</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        </label>
        <button
          type="submit"
          disabled={addMutation.isPending || !lines.some((l) => l.medicationId)}
          className="w-fit rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {addMutation.isPending ? 'Đang lưu…' : 'Lưu đơn thuốc'}
        </button>
      </form>

      {saved.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-sm font-medium">Đơn thuốc đã lưu (trong phiên này)</p>
          {saved.map((p) => (
            <ul key={p.id} className="list-inside list-disc text-sm text-muted">
              {p.items.map((it) => (
                <li key={it.id}>
                  {it.medication?.item.itemName ?? it.medicationId} — {it.dosage} — {it.durationDays} ngày
                </li>
              ))}
            </ul>
          ))}
        </div>
      )}
    </section>
  );
}

function LabTestsSection({ examinationId }: { examinationId: string }) {
  const [testName, setTestName] = useState('');
  const [labTests, setLabTests] = useState<LabTestOrder[]>([]);

  const addMutation = useMutation({
    mutationFn: () => examinationsApi.addLabTest(examinationId, testName),
    onSuccess: (order) => {
      setLabTests((prev) => [...prev, order]);
      setTestName('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; status: LabTestStatus; resultText: string }) =>
      examinationsApi.updateLabTest(payload.id, { status: payload.status, resultText: payload.resultText || undefined }),
    onSuccess: (updated) => {
      setLabTests((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    },
  });

  return (
    <section className="rounded border border-border bg-surface p-4">
      <h2 className="mb-3 font-medium">Xét nghiệm</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (testName.trim()) addMutation.mutate();
        }}
        className="mb-4 flex flex-wrap items-end gap-2"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Tên xét nghiệm</span>
          <input value={testName} onChange={(e) => setTestName(e.target.value)} className="rounded border border-border bg-surface px-3 py-2 text-sm" />
        </label>
        <button
          type="submit"
          disabled={addMutation.isPending || !testName.trim()}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Thêm xét nghiệm
        </button>
      </form>

      {labTests.length === 0 ? (
        <p className="text-sm text-muted">
          Chưa có xét nghiệm nào được thêm trong phiên này. (API hiện không hỗ trợ tải danh sách xét nghiệm đã lưu
          trước đó cho một phiếu khám — chỉ các mục thêm/cập nhật trong phiên hiện tại được hiển thị.)
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {labTests.map((test) => (
            <LabTestRow key={test.id} test={test} onSave={(status, resultText) => updateMutation.mutate({ id: test.id, status, resultText })} saving={updateMutation.isPending} />
          ))}
        </div>
      )}
    </section>
  );
}

function LabTestRow({
  test,
  onSave,
  saving,
}: {
  test: LabTestOrder;
  onSave: (status: LabTestStatus, resultText: string) => void;
  saving: boolean;
}) {
  const [status, setStatus] = useState<LabTestStatus>(test.status);
  const [resultText, setResultText] = useState(test.resultText ?? '');

  return (
    <div className="grid grid-cols-1 gap-2 rounded border border-border p-3 sm:grid-cols-[2fr_1fr_2fr_auto]">
      <span className="self-center text-sm font-medium">{test.testName}</span>
      <select value={status} onChange={(e) => setStatus(e.target.value as LabTestStatus)} className="rounded border border-border bg-surface px-2 py-1.5 text-sm">
        {Object.values(LabTestStatus).map((s) => (
          <option key={s} value={s}>
            {LAB_TEST_STATUS_LABEL_VI[s]}
          </option>
        ))}
      </select>
      <input
        value={resultText}
        onChange={(e) => setResultText(e.target.value)}
        placeholder="Kết quả"
        className="rounded border border-border bg-surface px-2 py-1.5 text-sm"
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => onSave(status, resultText)}
        className="rounded border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-50"
      >
        Lưu
      </button>
    </div>
  );
}

function FollowUpSection({
  appointmentId,
  appt,
}: {
  appointmentId: string;
  appt: { doctorId: string; branchId: string; serviceId: string };
}) {
  const [branchId, setBranchId] = useState(appt.branchId);
  const [doctorId, setDoctorId] = useState(appt.doctorId);
  const [serviceId, setServiceId] = useState(appt.serviceId);
  const [startAt, setStartAt] = useState('');

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const doctorsQuery = useQuery({ queryKey: ['doctors-public', branchId], queryFn: () => doctorsApi.listPublic(branchId) });
  const servicesQuery = useQuery({ queryKey: ['services', 'for-followup'], queryFn: () => catalogApi.services({ limit: 100 }) });

  const followUpMutation = useMutation({
    mutationFn: () =>
      appointmentsApi.scheduleFollowUp(appointmentId, {
        doctorId,
        branchId,
        serviceId,
        startAt: new Date(startAt).toISOString(),
      }),
  });

  return (
    <section className="rounded border border-border bg-surface p-4">
      <h2 className="mb-3 font-medium">Đặt lịch tái khám</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (startAt) followUpMutation.mutate();
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Chi nhánh</span>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded border border-border bg-surface px-3 py-2 text-sm">
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Bác sĩ</span>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="rounded border border-border bg-surface px-3 py-2 text-sm">
            {(doctorsQuery.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Dịch vụ</span>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="rounded border border-border bg-surface px-3 py-2 text-sm">
            {(servicesQuery.data?.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.item.itemName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Thời gian</span>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={followUpMutation.isPending || !startAt}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {followUpMutation.isPending ? 'Đang đặt…' : 'Đặt lịch tái khám'}
        </button>
      </form>
      {followUpMutation.isSuccess && followUpMutation.data && (
        <p className="mt-2 text-sm text-triage-green">
          Đã đặt lịch tái khám —{' '}
          <Link to={`/staff/appointments/${followUpMutation.data.id}`} className="underline">
            xem lịch hẹn mới
          </Link>
        </p>
      )}
      {followUpMutation.isError && <p className="mt-2 text-sm text-destructive">Đặt lịch tái khám thất bại.</p>}
    </section>
  );
}
