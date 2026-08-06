import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { appointmentsApi } from '@/api/appointments.api';
import { examinationsApi } from '@/api/examinations.api';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { catalogApi } from '@/api/catalog.api';
import { laboratoriesApi } from '@/api/laboratories.api';
import { vaccinationsApi } from '@/api/vaccinations.api';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi } from '@/api/doctors.api';
import { filesApi } from '@/api/files.api';
import { Badge, Button, Input, Select, Textarea, useToast } from '@/components/basic';
import {
  Diagnosis,
  LabTestOrder,
  MedicalRecord,
  Medication,
  Prescription,
  Treatment,
} from '@/types/models';
import {
  DiagnosisSeverity,
  LAB_RESULT_FLAG_LABEL_VI,
  LabResultFlag,
  MEDICATION_ROUTE_LABEL_VI,
  MedicalRecordStatus,
  MedicationRoute,
  PRESCRIPTION_STATUS_LABEL_VI,
} from '@/types/enums';
import { formatDate, formatDateTime } from '@/utils/format';
import {
  DIAGNOSIS_SEVERITY_LABEL_VI,
  LAB_TEST_STATUS_LABEL_VI,
  MEDICAL_RECORD_STATUS_LABEL_VI,
  labResultFlagClasses,
} from '@/utils/labels';

/**
 * Màn hình khám bệnh — UC-03.
 *
 * Bố cục 2 cột theo đúng FR-07 (*"Bác sĩ có thể xem các lần khám trước"*): cột trái là
 * bệnh sử các lần trước, cột phải là form nhập của lần này. Bác sĩ cần nhìn lần khám
 * trước **trong lúc** khám, không phải mở tab khác rồi nhớ lại.
 *
 * Thứ tự các khối bên phải bám đúng luồng UC-03: hành chính → sinh hiệu → chẩn đoán →
 * điều trị → xét nghiệm → đơn thuốc → hoàn tất.
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

/**
 * BR-06 (chưa check-in) và lịch hẹn đã kết thúc đều trả 409 kèm thông báo tiếng Việt
 * đã đủ rõ - hiển thị nguyên văn thay vì dịch lại một lần nữa ở client.
 */
function OpenRecordError({ error }: { error: unknown }) {
  const message = extractApiMessage(error) ?? 'Không thể mở hồ sơ bệnh án cho lịch hẹn này.';
  return (
    <div className="rounded border border-destructive bg-destructive/5 p-4">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// Cột trái — bệnh sử
// ---------------------------------------------------------------------------------

function PetHistoryPanel({
  petId,
  currentRecordId,
}: {
  petId: string;
  currentRecordId: string;
}) {
  const historyQuery = useQuery({
    queryKey: ['medical-records', 'by-pet', petId],
    queryFn: () => medicalRecordsApi.getTimelineForPet(petId),
  });

  // Lần khám ĐANG diễn ra đã nằm ở cột phải - để lại ở cột trái là nhìn thấy hai lần.
  const previous = (historyQuery.data ?? []).filter((r) => r.id !== currentRecordId);

  return (
    <aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <h2 className="font-medium">Bệnh sử ({previous.length})</h2>
      {historyQuery.isLoading && <p className="text-sm text-muted">Đang tải bệnh sử…</p>}
      {!historyQuery.isLoading && previous.length === 0 && (
        <p className="rounded border border-border bg-surface p-4 text-sm text-muted">
          Đây là lần khám đầu tiên được ghi nhận cho thú cưng này.
        </p>
      )}
      {previous.map((record) => (
        <HistoryCard key={record.id} record={record} />
      ))}
    </aside>
  );
}

function HistoryCard({ record }: { record: MedicalRecord }) {
  const [expanded, setExpanded] = useState(false);
  const visitedAt = record.examination?.examinedAt ?? record.createdAt;
  const primary = (record.diagnoses ?? []).find((d) => d.isPrimary) ?? record.diagnoses?.[0];

  return (
    <article className="rounded border border-border bg-surface p-3 text-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <span>
          <span className="font-medium">{formatDate(visitedAt)}</span>
          <span className="block text-muted">BS. {record.doctor?.fullName ?? '—'}</span>
        </span>
        <Badge variant={record.status === MedicalRecordStatus.COMPLETED ? 'success' : 'warning'}>
          {MEDICAL_RECORD_STATUS_LABEL_VI[record.status]}
        </Badge>
      </button>

      <p className="mt-2 text-foreground">{primary?.diagnosisText ?? 'Chưa có chẩn đoán'}</p>

      {expanded && (
        <dl className="mt-3 flex flex-col gap-2 border-t border-border pt-3 text-xs">
          {record.visitReason && (
            <div>
              <dt className="text-muted">Lý do khám</dt>
              <dd>{record.visitReason}</dd>
            </div>
          )}
          {(record.diagnoses ?? []).length > 0 && (
            <div>
              <dt className="text-muted">Chẩn đoán</dt>
              <dd>
                <ul className="list-inside list-disc">
                  {record.diagnoses!.map((d) => (
                    <li key={d.id}>
                      {d.diagnosisText} — {DIAGNOSIS_SEVERITY_LABEL_VI[d.severity]}
                      {d.isPrimary ? ' (chính)' : ''}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {(record.treatments ?? []).length > 0 && (
            <div>
              <dt className="text-muted">Điều trị</dt>
              <dd>
                <ul className="list-inside list-disc">
                  {record.treatments!.map((t) => (
                    <li key={t.id}>{t.method}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {record.examination && (
            <div>
              <dt className="text-muted">Sinh hiệu</dt>
              <dd>
                {record.examination.temperatureCelsius ?? '—'} °C ·{' '}
                {record.examination.weightKg ?? '—'} kg
              </dd>
            </div>
          )}
          {record.notes && (
            <div>
              <dt className="text-muted">Ghi chú</dt>
              <dd>{record.notes}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------------
// Cột phải — lần khám này
// ---------------------------------------------------------------------------------

function CurrentVisitPanel({
  record,
  appointmentId,
  appt,
}: {
  record: MedicalRecord;
  appointmentId: string;
  appt: { doctorId: string; branchId: string; serviceId: string };
}) {
  // BR-08 - hồ sơ đã hoàn tất thì mọi ô nhập bị khoá. Một cờ duy nhất, truyền xuống mọi
  // khối con: nếu để từng khối tự hỏi trạng thái, chỉ cần quên một chỗ là BR-08 thủng.
  const readOnly = record.status === MedicalRecordStatus.COMPLETED;

  return (
    <div className="flex flex-col gap-6">
      {readOnly && (
        <div className="rounded border border-border bg-surface-muted p-4">
          <p className="text-sm font-medium">Hồ sơ đã hoàn tất — chỉ xem</p>
          <p className="mt-1 text-sm text-muted">
            Hoàn tất lúc {record.completedAt ? formatDateTime(record.completedAt) : '—'}. Theo BR-08,
            hồ sơ bệnh án đã chốt không được sửa; mọi thay đổi sau đó phải đi qua đường sửa có ghi
            nhật ký kiểm toán.
          </p>
        </div>
      )}

      <RecordHeaderSection record={record} readOnly={readOnly} />
      <VitalsSection record={record} readOnly={readOnly} />
      <DiagnosesSection record={record} readOnly={readOnly} />
      <TreatmentsSection record={record} readOnly={readOnly} />
      <LabTestsSection record={record} readOnly={readOnly} />
      <VaccinationsSection record={record} readOnly={readOnly} />
      <PrescriptionsSection record={record} readOnly={readOnly} />
      <CompleteSection record={record} readOnly={readOnly} />
      {readOnly && <FollowUpSection appointmentId={appointmentId} appt={appt} />}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Khối hành chính (FR-07): lý do khám + tình trạng chung + ghi chú của hồ sơ. */
function RecordHeaderSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [visitReason, setVisitReason] = useState(record.visitReason ?? '');
  const [generalCondition, setGeneralCondition] = useState(record.generalCondition ?? '');
  const [notes, setNotes] = useState(record.notes ?? '');

  const saveMutation = useMutation({
    mutationFn: () =>
      medicalRecordsApi.update(record.id, { visitReason, generalCondition, notes }),
    onSuccess: () => {
      toast.show('Đã lưu thông tin hồ sơ', 'success');
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Lưu thất bại', 'error'),
  });

  return (
    <Section title="Thông tin lần khám">
      <div className="flex flex-col gap-3">
        <Textarea
          label="Lý do khám"
          rows={2}
          value={visitReason}
          disabled={readOnly}
          onChange={(e) => setVisitReason(e.target.value)}
          hint="Lý do bác sĩ ghi lại sau khi hỏi bệnh — khác lời khách tự kể lúc đặt lịch."
        />
        <Textarea
          label="Tình trạng chung"
          rows={2}
          value={generalCondition}
          disabled={readOnly}
          onChange={(e) => setGeneralCondition(e.target.value)}
        />
        <Textarea
          label="Ghi chú"
          rows={2}
          value={notes}
          disabled={readOnly}
          onChange={(e) => setNotes(e.target.value)}
        />
        {!readOnly && (
          <Button
            type="button"
            className="w-fit"
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Lưu thông tin
          </Button>
        )}
      </div>
    </Section>
  );
}

interface VitalsFormState {
  temperatureCelsius: string;
  weightKg: string;
  heartRateBpm: string;
  respiratoryRateBpm: string;
  notes: string;
}

function toOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/** Khối sinh hiệu — vẫn là entity `Examination`, phần "sinh hiệu" của hồ sơ. */
function VitalsSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const examination = record.examination ?? null;

  const [form, setForm] = useState<VitalsFormState>({
    temperatureCelsius: examination?.temperatureCelsius?.toString() ?? '',
    weightKg: examination?.weightKg?.toString() ?? '',
    heartRateBpm: examination?.heartRateBpm?.toString() ?? '',
    respiratoryRateBpm: examination?.respiratoryRateBpm?.toString() ?? '',
    notes: examination?.notes ?? '',
  });
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>(examination?.attachmentUrls ?? []);
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        temperatureCelsius: toOptionalNumber(form.temperatureCelsius),
        weightKg: toOptionalNumber(form.weightKg),
        heartRateBpm: toOptionalNumber(form.heartRateBpm),
        respiratoryRateBpm: toOptionalNumber(form.respiratoryRateBpm),
        notes: form.notes || undefined,
        attachmentUrls,
      };
      return examination
        ? examinationsApi.update(examination.id, payload)
        : examinationsApi.create({ appointmentId: record.appointmentId, ...payload });
    },
    onSuccess: () => {
      toast.show('Đã lưu sinh hiệu', 'success');
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Lưu thất bại', 'error'),
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

  function set<K extends keyof VitalsFormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Section
      title="Sinh hiệu & triệu chứng"
      action={
        examination && !readOnly ? <DownloadPdfButton examinationId={examination.id} /> : undefined
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Nhiệt độ (°C)"
          type="number"
          step="0.1"
          disabled={readOnly}
          value={form.temperatureCelsius}
          onChange={(e) => set('temperatureCelsius', e.target.value)}
        />
        <Input
          label="Cân nặng (kg)"
          type="number"
          step="0.01"
          disabled={readOnly}
          value={form.weightKg}
          onChange={(e) => set('weightKg', e.target.value)}
        />
        <Input
          label="Nhịp tim (lần/phút)"
          type="number"
          disabled={readOnly}
          value={form.heartRateBpm}
          onChange={(e) => set('heartRateBpm', e.target.value)}
        />
        <Input
          label="Nhịp thở (lần/phút)"
          type="number"
          disabled={readOnly}
          value={form.respiratoryRateBpm}
          onChange={(e) => set('respiratoryRateBpm', e.target.value)}
        />
      </div>

      <div className="mt-3">
        <Textarea
          label="Triệu chứng ghi nhận"
          rows={3}
          disabled={readOnly}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      {!readOnly && (
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-muted">Ảnh/tệp đính kèm</span>
          <input
            type="file"
            multiple
            onChange={(e) => void handleFilesSelected(e.target.files)}
            className="text-sm"
          />
          {uploading && <span className="text-muted">Đang tải lên…</span>}
        </label>
      )}
      {attachmentUrls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachmentUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="Tệp đính kèm" className="h-16 w-16 rounded object-cover" />
            </a>
          ))}
        </div>
      )}

      {!readOnly && (
        <Button
          type="button"
          className="mt-3 w-fit"
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {examination ? 'Cập nhật sinh hiệu' : 'Lưu sinh hiệu'}
        </Button>
      )}
      {readOnly && examination && (
        <div className="mt-3">
          <DownloadPdfButton examinationId={examination.id} />
        </div>
      )}
    </Section>
  );
}

const SEVERITY_OPTIONS = Object.values(DiagnosisSeverity).map((value) => ({
  value,
  label: DIAGNOSIS_SEVERITY_LABEL_VI[value],
}));

/** Khối chẩn đoán (FR-09) — nhiều chẩn đoán trên cùng một hồ sơ, đúng một cái là chính. */
function DiagnosesSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const diagnoses = record.diagnoses ?? [];

  const [diagnosisText, setDiagnosisText] = useState('');
  const [severity, setSeverity] = useState<string>(DiagnosisSeverity.MILD);
  const [diseaseId, setDiseaseId] = useState('');
  const [notes, setNotes] = useState('');

  // `limit` tối đa 100 (PaginationQueryDto phía backend) - gửi 200 sẽ bị trả 400 và ô
  // chọn bệnh lặng lẽ rỗng.
  const diseasesQuery = useQuery({
    queryKey: ['diseases', 'for-diagnosis'],
    queryFn: () => catalogApi.diseases({ limit: 100 }),
  });
  const diseaseOptions = [
    { value: '', label: '— Không chọn từ danh mục —' },
    ...((diseasesQuery.data?.data ?? []) as { id: string; diseaseName: string }[]).map((d) => ({
      value: d.id,
      label: d.diseaseName,
    })),
  ];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['medical-record'] });

  const addMutation = useMutation({
    mutationFn: () =>
      medicalRecordsApi.addDiagnosis(record.id, {
        diagnosisText,
        severity,
        diseaseId: diseaseId || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      setDiagnosisText('');
      setNotes('');
      setDiseaseId('');
      setSeverity(DiagnosisSeverity.MILD);
      toast.show('Đã thêm chẩn đoán', 'success');
      void invalidate();
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Thêm thất bại', 'error'),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => medicalRecordsApi.updateDiagnosis(id, { isPrimary: true }),
    onSuccess: () => void invalidate(),
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Cập nhật thất bại', 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => medicalRecordsApi.removeDiagnosis(id),
    onSuccess: () => {
      toast.show('Đã xoá chẩn đoán', 'success');
      void invalidate();
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Xoá thất bại', 'error'),
  });

  return (
    <Section title="Chẩn đoán">
      {diagnoses.length === 0 ? (
        <p className="text-sm text-muted">Chưa có chẩn đoán nào.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {diagnoses.map((diagnosis) => (
            <DiagnosisRow
              key={diagnosis.id}
              diagnosis={diagnosis}
              readOnly={readOnly}
              onSetPrimary={() => setPrimaryMutation.mutate(diagnosis.id)}
              onRemove={() => removeMutation.mutate(diagnosis.id)}
            />
          ))}
        </ul>
      )}

      {!readOnly && (
        <form
          className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (diagnosisText.trim()) addMutation.mutate();
          }}
        >
          <Textarea
            label="Chẩn đoán"
            rows={2}
            value={diagnosisText}
            onChange={(e) => setDiagnosisText(e.target.value)}
            placeholder="Ví dụ: Viêm da dị ứng nhẹ, nghi do phấn hoa"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Mức độ"
              value={severity}
              onChange={setSeverity}
              options={SEVERITY_OPTIONS}
            />
            <Select
              label="Bệnh trong danh mục (tuỳ chọn)"
              value={diseaseId}
              onChange={setDiseaseId}
              options={diseaseOptions}
              hint="Bỏ trống nếu bệnh chưa có trong danh mục."
            />
          </div>
          <Input
            label="Ghi chú"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            type="submit"
            className="w-fit"
            loading={addMutation.isPending}
            disabled={!diagnosisText.trim()}
          >
            + Thêm chẩn đoán
          </Button>
        </form>
      )}
    </Section>
  );
}

function DiagnosisRow({
  diagnosis,
  readOnly,
  onSetPrimary,
  onRemove,
}: {
  diagnosis: Diagnosis;
  readOnly: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded border border-border p-3 text-sm">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{diagnosis.diagnosisText}</span>
          <Badge variant="outline">{DIAGNOSIS_SEVERITY_LABEL_VI[diagnosis.severity]}</Badge>
          {diagnosis.isPrimary && <Badge>Chẩn đoán chính</Badge>}
        </p>
        {diagnosis.disease && (
          <p className="text-muted">Danh mục: {diagnosis.disease.diseaseName}</p>
        )}
        {diagnosis.notes && <p className="text-muted">{diagnosis.notes}</p>}
      </div>
      {!readOnly && (
        <div className="flex shrink-0 gap-2">
          {!diagnosis.isPrimary && (
            <Button type="button" variant="secondary" size="sm" onClick={onSetPrimary}>
              Đặt làm chính
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Xoá
          </Button>
        </div>
      )}
    </li>
  );
}

/** Khối điều trị (FR-10) — `endDate` bỏ trống nghĩa là điều trị đang tiếp diễn. */
function TreatmentsSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const treatments = record.treatments ?? [];

  const [method, setMethod] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [instruction, setInstruction] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['medical-record'] });

  const addMutation = useMutation({
    mutationFn: () =>
      medicalRecordsApi.addTreatment(record.id, {
        method,
        description: description || undefined,
        startDate,
        endDate: endDate || undefined,
        instruction: instruction || undefined,
      }),
    onSuccess: () => {
      setMethod('');
      setDescription('');
      setEndDate('');
      setInstruction('');
      toast.show('Đã thêm phương pháp điều trị', 'success');
      void invalidate();
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Thêm thất bại', 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => medicalRecordsApi.removeTreatment(id),
    onSuccess: () => void invalidate(),
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Xoá thất bại', 'error'),
  });

  return (
    <Section title="Điều trị">
      {treatments.length === 0 ? (
        <p className="text-sm text-muted">Chưa ghi phương pháp điều trị nào.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {treatments.map((treatment) => (
            <TreatmentRow
              key={treatment.id}
              treatment={treatment}
              readOnly={readOnly}
              onRemove={() => removeMutation.mutate(treatment.id)}
            />
          ))}
        </ul>
      )}

      {!readOnly && (
        <form
          className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (method.trim() && startDate) addMutation.mutate();
          }}
        >
          <Input
            label="Phương pháp"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="Ví dụ: Truyền dịch, Tiêm kháng sinh, Bôi thuốc ngoài da"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Ngày bắt đầu"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Ngày kết thúc"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              hint="Bỏ trống nếu điều trị còn tiếp diễn."
            />
          </div>
          <Textarea
            label="Mô tả (phòng khám đã làm gì)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Textarea
            label="Hướng dẫn cho chủ nuôi"
            rows={2}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <Button
            type="submit"
            className="w-fit"
            loading={addMutation.isPending}
            disabled={!method.trim() || !startDate}
          >
            + Thêm điều trị
          </Button>
        </form>
      )}
    </Section>
  );
}

function TreatmentRow({
  treatment,
  readOnly,
  onRemove,
}: {
  treatment: Treatment;
  readOnly: boolean;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded border border-border p-3 text-sm">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{treatment.method}</span>
          <Badge variant="outline">
            {formatDate(treatment.startDate)} →{' '}
            {treatment.endDate ? formatDate(treatment.endDate) : 'đang tiếp diễn'}
          </Badge>
        </p>
        {treatment.description && <p className="text-muted">{treatment.description}</p>}
        {treatment.instruction && (
          <p className="text-muted">Hướng dẫn: {treatment.instruction}</p>
        )}
      </div>
      {!readOnly && (
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Xoá
        </Button>
      )}
    </li>
  );
}

/**
 * Khối xét nghiệm. Chỉ định phải đi qua `POST /examinations/:id/lab-tests`, nên phải có
 * phiếu sinh hiệu trước - đó là lý do khối này nhắc bác sĩ lưu sinh hiệu khi chưa có.
 *
 * `readOnly` chỉ khoá việc CHỈ ĐỊNH THÊM, không khoá việc nhập kết quả - xem ghi chú ở
 * `LabTestRow` về ngoại lệ có chủ đích của BR-08 (P9-T7).
 */
function LabTestsSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const examination = record.examination ?? null;
  const labTests = record.labTestOrders ?? [];
  const [testName, setTestName] = useState('');

  const addMutation = useMutation({
    mutationFn: () => examinationsApi.addLabTest(examination!.id, testName),
    onSuccess: () => {
      setTestName('');
      toast.show('Đã chỉ định xét nghiệm - yêu cầu đã vào hàng chờ xét nghiệm', 'success');
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Thêm thất bại', 'error'),
  });

  return (
    <Section title="Xét nghiệm">
      {labTests.length === 0 ? (
        <p className="text-sm text-muted">Chưa chỉ định xét nghiệm nào.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {labTests.map((test) => (
            <LabTestRow key={test.id} test={test} />
          ))}
        </div>
      )}

      {readOnly && labTests.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          Hồ sơ đã hoàn tất nhưng kết quả xét nghiệm vẫn nhập được — kết quả về muộn là
          chuyện bình thường, và ghi một con số đo được không sửa kết luận chuyên môn nào
          (ngoại lệ có chủ đích của BR-08).
        </p>
      )}

      {!readOnly &&
        (examination ? (
          <form
            className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (testName.trim()) addMutation.mutate();
            }}
          >
            <Input
              label="Tên xét nghiệm"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
            <Button type="submit" loading={addMutation.isPending} disabled={!testName.trim()}>
              Chỉ định xét nghiệm
            </Button>
          </form>
        ) : (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
            Cần lưu sinh hiệu trước khi chỉ định xét nghiệm.
          </p>
        ))}
    </Section>
  );
}

/**
 * Một yêu cầu xét nghiệm kèm bảng chỉ số — P9-T5, P9-T7.
 *
 * `readOnly` (hồ sơ đã COMPLETED) **không** khoá phần nhập kết quả, khác mọi khối khác
 * trên màn hình này. Đây là ngoại lệ có chủ đích của BR-08: kết quả xét nghiệm về muộn
 * là chuyện bình thường, và bắt hồ sơ mở chờ kết quả thì hoặc hồ sơ bị treo hàng loạt,
 * hoặc kết quả về rồi không có chỗ ghi vào. Ghi một con số đo được không sửa kết luận
 * chuyên môn nào — chẩn đoán, điều trị, đơn thuốc vẫn khoá cứng. Xem `LaboratoriesService`
 * ở backend, nơi cùng quyết định này được ghi lại đầy đủ.
 */
function LabTestRow({ test }: { test: LabTestOrder }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<LabResultLine[]>([]);
  const [resultText, setResultText] = useState(test.resultText ?? '');

  const results = test.results ?? [];

  const saveMutation = useMutation({
    mutationFn: () =>
      laboratoriesApi.saveResults(test.id, {
        resultText: resultText || undefined,
        results: rows
          .filter((row) => row.parameter.trim() && row.value.trim())
          .map((row) => ({
            parameter: row.parameter.trim(),
            value: Number(row.value),
            unit: row.unit || undefined,
            referenceMin: row.referenceMin === '' ? null : Number(row.referenceMin),
            referenceMax: row.referenceMax === '' ? null : Number(row.referenceMax),
            // Bỏ trống = để backend tự tính từ khoảng tham chiếu. Chỉ gửi `flag` khi kỹ
            // thuật viên chủ động chọn - gửi kèm mọi lần lưu sẽ biến mọi kết quả thành
            // "đã ghi đè" và cờ tự động không bao giờ chạy nữa.
            flag: row.flag === '' ? undefined : (row.flag as LabResultFlag),
          })),
      }),
    onSuccess: () => {
      toast.show('Đã lưu kết quả xét nghiệm', 'success');
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Lưu kết quả thất bại', 'error'),
  });

  function startEditing() {
    setRows(
      results.length > 0
        ? results.map((result) => ({
            parameter: result.parameter,
            value: String(result.value),
            unit: result.unit ?? '',
            referenceMin: result.referenceMin === null ? '' : String(result.referenceMin),
            referenceMax: result.referenceMax === null ? '' : String(result.referenceMax),
            flag: result.flagOverridden ? result.flag : '',
          }))
        : [{ ...EMPTY_RESULT_LINE }],
    );
    setResultText(test.resultText ?? '');
    setEditing(true);
  }

  return (
    <div className="rounded border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{test.testName}</p>
          <p className="text-xs text-muted">
            {LAB_TEST_STATUS_LABEL_VI[test.status]}
            {test.resultDate ? ` · Có kết quả ${formatDateTime(test.resultDate)}` : ''}
            {test.technician ? ` · KTV ${test.technician.fullName}` : ''}
          </p>
        </div>
        {!editing && (
          <Button type="button" variant="secondary" size="sm" onClick={startEditing}>
            {results.length > 0 ? 'Sửa kết quả' : 'Nhập kết quả'}
          </Button>
        )}
      </div>

      {!editing && results.length > 0 && (
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-1 pr-3 font-medium">Chỉ số</th>
              <th className="py-1 pr-3 text-right font-medium">Giá trị</th>
              <th className="py-1 pr-3 font-medium">Đơn vị</th>
              <th className="py-1 pr-3 font-medium">Tham chiếu</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.id} className="border-b border-border/60">
                <td className="py-1 pr-3">{result.parameter}</td>
                <td className="py-1 pr-3 text-right tabular-nums">
                  <span className={`rounded px-1.5 py-0.5 ${labResultFlagClasses(result.flag)}`}>
                    {result.value}
                  </span>
                </td>
                <td className="py-1 pr-3 text-muted">{result.unit ?? '—'}</td>
                <td className="py-1 pr-3 text-xs text-muted">
                  {result.referenceMin ?? '—'} – {result.referenceMax ?? '—'}
                  {result.flagOverridden ? ' · KTV ghi đè' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!editing && test.resultText && <p className="mt-2 text-sm">{test.resultText}</p>}
      {!editing && results.length === 0 && !test.resultText && (
        <p className="mt-2 text-sm text-muted">Chưa có kết quả.</p>
      )}

      {editing && (
        <form
          className="mt-3 flex flex-col gap-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr_auto]"
            >
              <Input
                placeholder="Chỉ số (WBC)"
                value={row.parameter}
                onChange={(e) => updateRow(setRows, index, { parameter: e.target.value })}
              />
              <Input
                type="number"
                step="any"
                placeholder="Giá trị"
                value={row.value}
                onChange={(e) => updateRow(setRows, index, { value: e.target.value })}
              />
              <Input
                placeholder="Đơn vị"
                value={row.unit}
                onChange={(e) => updateRow(setRows, index, { unit: e.target.value })}
              />
              <Input
                type="number"
                step="any"
                placeholder="Cận dưới"
                value={row.referenceMin}
                onChange={(e) => updateRow(setRows, index, { referenceMin: e.target.value })}
              />
              <Input
                type="number"
                step="any"
                placeholder="Cận trên"
                value={row.referenceMax}
                onChange={(e) => updateRow(setRows, index, { referenceMax: e.target.value })}
              />
              <Select
                value={row.flag}
                onChange={(value) => updateRow(setRows, index, { flag: value })}
                options={[
                  { value: '', label: 'Cờ: tự tính' },
                  ...Object.values(LabResultFlag).map((flag) => ({
                    value: flag,
                    label: LAB_RESULT_FLAG_LABEL_VI[flag],
                  })),
                ]}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              >
                Xoá
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-fit"
            onClick={() => setRows((prev) => [...prev, { ...EMPTY_RESULT_LINE }])}
          >
            + Thêm chỉ số
          </Button>

          <Textarea
            label="Kết quả dạng chữ / diễn giải (tuỳ chọn)"
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            rows={2}
          />

          <div className="flex gap-2">
            <Button type="submit" loading={saveMutation.isPending}>
              Lưu kết quả
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Huỷ
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

interface LabResultLine {
  parameter: string;
  value: string;
  unit: string;
  referenceMin: string;
  referenceMax: string;
  /** Chuỗi rỗng = để backend tự tính cờ từ khoảng tham chiếu. */
  flag: string;
}

const EMPTY_RESULT_LINE: LabResultLine = {
  parameter: '',
  value: '',
  unit: '',
  referenceMin: '',
  referenceMax: '',
  flag: '',
};

function updateRow(
  setRows: React.Dispatch<React.SetStateAction<LabResultLine[]>>,
  index: number,
  patch: Partial<LabResultLine>,
) {
  setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
}

/**
 * Khối tiêm chủng trong lúc khám — acceptance P9-T3: "ghi nhận được ngay trong màn hình
 * khám, không phải rời trang".
 *
 * Danh mục vaccine được lọc theo `petId`: backend suy ra loài từ giống của con này, và
 * chỉ trả vaccine dùng được cho loài đó (cộng các vaccine dùng cho mọi loài). Đưa cả
 * danh mục ra rồi để bác sĩ tự tránh là mở đường cho một mũi vaccine chó tiêm vào mèo.
 */
function VaccinationsSection({
  record,
  readOnly,
}: {
  record: MedicalRecord;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [vaccineId, setVaccineId] = useState('');
  const [notes, setNotes] = useState('');

  const vaccinesQuery = useQuery({
    queryKey: ['vaccines', 'for-pet', record.petId],
    queryFn: () => vaccinationsApi.catalog({ petId: record.petId, limit: 100 }),
  });
  const vaccines = vaccinesQuery.data?.data ?? [];

  const givenQuery = useQuery({
    queryKey: ['vaccinations', 'by-record', record.id],
    queryFn: () => vaccinationsApi.byMedicalRecord(record.id),
  });
  const given = givenQuery.data ?? [];

  const addMutation = useMutation({
    mutationFn: () =>
      vaccinationsApi.create({
        petId: record.petId,
        vaccineId,
        medicalRecordId: record.id,
        notes: notes || undefined,
      }),
    onSuccess: (view) => {
      setVaccineId('');
      setNotes('');
      toast.show(
        view.vaccination.nextDueDate
          ? `Đã ghi nhận mũi tiêm. Hẹn nhắc lại ${formatDate(view.vaccination.nextDueDate)}.`
          : 'Đã ghi nhận mũi tiêm.',
        'success',
      );
      void queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    // BR-11 (vaccine hết hạn) và hết hàng đều trả 409 kèm thông báo đã đủ rõ - hiện
    // nguyên văn thay vì dịch lại một lần nữa ở client.
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Ghi nhận thất bại', 'error'),
  });

  return (
    <Section title="Tiêm chủng">
      {given.length === 0 ? (
        <p className="text-sm text-muted">Chưa ghi nhận mũi tiêm nào trong lần khám này.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {given.map((view) => (
            <li key={view.vaccination.id} className="rounded border border-border p-3 text-sm">
              <p className="font-medium">
                {view.vaccination.vaccine?.item.itemName ?? '—'} — mũi {view.vaccination.doseNumber}
                {view.vaccination.vaccine ? `/${view.vaccination.vaccine.doseCount}` : ''}
              </p>
              <p className="text-muted">
                Lô {view.vaccination.batchNo ?? '—'}
                {view.vaccination.expiryDate
                  ? ` · HSD ${formatDate(view.vaccination.expiryDate)}`
                  : ''}
                {view.vaccination.nextDueDate
                  ? ` · Hẹn nhắc ${formatDate(view.vaccination.nextDueDate)}`
                  : ' · Không nhắc lại'}
              </p>
              {view.vaccination.notes && (
                <p className="mt-1 text-muted">{view.vaccination.notes}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <form
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (vaccineId) addMutation.mutate();
          }}
        >
          <Select
            label="Vaccine"
            value={vaccineId}
            onChange={setVaccineId}
            options={[
              { value: '', label: '— Chọn vaccine —' },
              ...vaccines.map((vaccine) => ({
                value: vaccine.id,
                label: `${vaccine.item.itemName} (${vaccine.diseasePrevented})`,
              })),
            ]}
          />
          <Input
            label="Ghi chú"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button type="submit" loading={addMutation.isPending} disabled={!vaccineId}>
            Ghi nhận mũi tiêm
          </Button>
        </form>
      )}

      {!readOnly && vaccines.length === 0 && !vaccinesQuery.isLoading && (
        <p className="mt-2 text-sm text-muted">
          Chưa có vaccine nào trong danh mục dùng được cho loài này.
        </p>
      )}
    </Section>
  );
}

interface PrescriptionLine {
  medicationId: string;
  /**
   * Số lượng thực cấp (P7, FR-11-01). Bác sĩ nhập tay chứ hệ thống **không** suy ra từ
   * liều × tần suất × số ngày: y lệnh thực tế có những dạng không quy về một con số
   * được ("khi sốt trên 39 độ"), mà đây lại là con số trừ kho và tính tiền.
   */
  quantity: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  route: MedicationRoute;
  instructions: string;
}

const EMPTY_LINE: PrescriptionLine = {
  medicationId: '',
  quantity: '',
  dosage: '',
  frequency: '',
  durationDays: '',
  route: MedicationRoute.ORAL,
  instructions: '',
};

function PrescriptionsSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const examination = record.examination ?? null;
  const prescriptions = record.prescriptions ?? [];

  const medicationsQuery = useQuery({
    queryKey: ['medications', 'for-prescription'],
    queryFn: () => catalogApi.medications({ limit: 100 }),
  });
  const medications: Medication[] = medicationsQuery.data?.data ?? [];
  const medicationOptions = [
    { value: '', label: '— Chọn thuốc —' },
    ...medications.map((m) => ({ value: m.id, label: `${m.item.itemName} (${m.unit})` })),
  ];

  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PrescriptionLine[]>([{ ...EMPTY_LINE }]);

  const addMutation = useMutation({
    mutationFn: () =>
      examinationsApi.addPrescription(examination!.id, {
        notes: notes || undefined,
        items: lines
          .filter((l) => l.medicationId)
          .map((l) => ({
            medicationId: l.medicationId,
            quantity: Number(l.quantity) || 0,
            dosage: l.dosage,
            frequency: l.frequency || undefined,
            durationDays: Number(l.durationDays) || 0,
            route: l.route,
            instructions: l.instructions || undefined,
          })),
      }),
    onSuccess: (view) => {
      setLines([{ ...EMPTY_LINE }]);
      setNotes('');
      // FR-11-02: thiếu tồn thì CẢNH BÁO chứ không chặn - đơn đã lưu, bác sĩ vẫn kê
      // được thuốc bệnh nhân cần. Nói rõ thiếu thuốc nào để dược sĩ biết đường nhập.
      const short = view.stockCheck.filter((s) => s.insufficientStock);
      if (short.length > 0) {
        toast.show(
          `Đã lưu đơn thuốc. Lưu ý kho đang thiếu: ${short
            .map((s) => `${s.medicationName} (cần ${s.requested}, còn ${s.availableQuantity})`)
            .join('; ')}`,
          'error',
        );
      } else {
        toast.show('Đã lưu đơn thuốc', 'success');
      }
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Lưu đơn thuốc thất bại', 'error'),
  });

  function updateLine(index: number, patch: Partial<PrescriptionLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  return (
    <Section title="Đơn thuốc">
      {prescriptions.length === 0 ? (
        <p className="text-sm text-muted">Chưa kê đơn thuốc nào.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {prescriptions.map((prescription: Prescription) => (
            <div key={prescription.id} className="rounded border border-border p-3 text-sm">
              <ul className="list-inside list-disc">
                {prescription.items.map((item) => (
                  <li key={item.id}>
                    {item.medication?.item.itemName ?? item.medicationId} — {item.quantity}{' '}
                    {item.medication?.unit ?? ''} — {item.dosage}
                    {item.frequency ? ` — ${item.frequency}` : ''} — {item.durationDays} ngày —{' '}
                    {MEDICATION_ROUTE_LABEL_VI[item.route] ?? item.route}
                    {item.instructions ? ` — ${item.instructions}` : ''}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-muted">
                Trạng thái: {PRESCRIPTION_STATUS_LABEL_VI[prescription.status] ?? prescription.status}
              </p>
              {prescription.notes && (
                <p className="mt-1 text-muted">Ghi chú: {prescription.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly &&
        (examination ? (
          <form
            className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              addMutation.mutate();
            }}
          >
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_2fr]"
              >
                <Select
                  value={line.medicationId}
                  onChange={(value) => updateLine(index, { medicationId: value })}
                  options={medicationOptions}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Số lượng"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                />
                <Input
                  placeholder="Liều dùng"
                  value={line.dosage}
                  onChange={(e) => updateLine(index, { dosage: e.target.value })}
                />
                <Input
                  placeholder="Tần suất"
                  value={line.frequency}
                  onChange={(e) => updateLine(index, { frequency: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Số ngày"
                  value={line.durationDays}
                  onChange={(e) => updateLine(index, { durationDays: e.target.value })}
                />
                <Select
                  value={line.route}
                  onChange={(value) => updateLine(index, { route: value as MedicationRoute })}
                  options={Object.values(MedicationRoute).map((route) => ({
                    value: route,
                    label: MEDICATION_ROUTE_LABEL_VI[route],
                  }))}
                />
                <Input
                  placeholder="Hướng dẫn (tuỳ chọn)"
                  value={line.instructions}
                  onChange={(e) => updateLine(index, { instructions: e.target.value })}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-fit"
              onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE }])}
            >
              + Thêm thuốc
            </Button>
            <Input
              label="Ghi chú đơn thuốc"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              type="submit"
              className="w-fit"
              loading={addMutation.isPending}
              disabled={!lines.some((l) => l.medicationId)}
            >
              Lưu đơn thuốc
            </Button>
          </form>
        ) : (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
            Cần lưu sinh hiệu trước khi kê đơn thuốc.
          </p>
        ))}
    </Section>
  );
}

/**
 * Chốt hồ sơ. Một hành động không lùi được, nên có bước xác nhận: sau khi bấm, BR-08
 * khoá toàn bộ hồ sơ và lịch hẹn chuyển sang COMPLETED.
 */
function CompleteSection({ record, readOnly }: { record: MedicalRecord; readOnly: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const completeMutation = useMutation({
    mutationFn: () => medicalRecordsApi.complete(record.id),
    onSuccess: () => {
      toast.show('Đã hoàn tất hồ sơ bệnh án', 'success');
      void queryClient.invalidateQueries({ queryKey: ['medical-record'] });
      void queryClient.invalidateQueries({ queryKey: ['appointment'] });
      void queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    onError: (error) => toast.show(extractApiMessage(error) ?? 'Hoàn tất thất bại', 'error'),
  });

  if (readOnly) return null;

  return (
    <Section title="Hoàn tất">
      {confirming ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Sau khi hoàn tất, hồ sơ <strong>không sửa được nữa</strong> (BR-08) và lịch hẹn sẽ
            chuyển sang trạng thái hoàn tất. Bạn chắc chắn chứ?
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              loading={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
            >
              Xác nhận hoàn tất
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
              Huỷ
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" className="w-fit" onClick={() => setConfirming(true)}>
          Hoàn tất hồ sơ bệnh án
        </Button>
      )}
    </Section>
  );
}

function DownloadPdfButton({ examinationId }: { examinationId: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await examinationsApi.downloadPdf(examinationId);
        } finally {
          setLoading(false);
        }
      }}
    >
      Xuất PDF
    </Button>
  );
}

/** Đặt lịch tái khám - chỉ hiện sau khi hồ sơ đã chốt, đúng thứ tự của UC-03. */
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
  const doctorsQuery = useQuery({
    queryKey: ['doctors-public', branchId],
    queryFn: () => doctorsApi.listPublic(branchId),
  });
  const servicesQuery = useQuery({
    queryKey: ['services', 'for-followup'],
    queryFn: () => catalogApi.services({ limit: 100 }),
  });

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
    <Section title="Đặt lịch tái khám">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (startAt) followUpMutation.mutate();
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={setBranchId}
          options={(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName }))}
        />
        <Select
          label="Bác sĩ"
          value={doctorId}
          onChange={setDoctorId}
          options={(doctorsQuery.data ?? []).map((d) => ({ value: d.id, label: d.fullName }))}
        />
        <Select
          label="Dịch vụ"
          value={serviceId}
          onChange={setServiceId}
          options={(servicesQuery.data?.data ?? []).map((s) => ({
            value: s.id,
            label: s.item.itemName,
          }))}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Thời gian</span>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="h-10 rounded border border-border bg-surface px-3 text-sm"
          />
        </label>
        <Button type="submit" loading={followUpMutation.isPending} disabled={!startAt}>
          Đặt lịch tái khám
        </Button>
      </form>
      {followUpMutation.isSuccess && followUpMutation.data && (
        <p className="mt-2 text-sm text-triage-green">
          Đã đặt lịch tái khám —{' '}
          <Link to={`/staff/appointments/${followUpMutation.data.id}`} className="underline">
            xem lịch hẹn mới
          </Link>
        </p>
      )}
      {followUpMutation.isError && (
        <p className="mt-2 text-sm text-destructive">Đặt lịch tái khám thất bại.</p>
      )}
    </Section>
  );
}

/** Backend trả `{ message: string | string[] }` - lấy ra để hiện nguyên văn cho người dùng. */
function extractApiMessage(error: unknown): string | null {
  const data = (error as AxiosError<{ message?: string | string[] }>)?.response?.data;
  if (!data?.message) return null;
  return Array.isArray(data.message) ? data.message.join(', ') : data.message;
}
