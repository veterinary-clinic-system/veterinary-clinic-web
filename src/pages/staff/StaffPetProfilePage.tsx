import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { Badge, Table } from '@/components/basic';
import type { Column } from '@/components/basic';
import { MedicalRecordStatus, PRIORITY_COLOR_LABEL_VI } from '@/types/enums';
import type {
  Pet,
  PetAppointment,
  PetInvoice,
  PetLabTest,
  PetMedicalHistory,
  PetPrescription,
} from '@/types/models';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import {
  APPOINTMENT_STATUS_LABEL_VI,
  GENDER_LABEL_VI,
  LAB_TEST_STATUS_LABEL_VI,
  MEDICAL_RECORD_STATUS_LABEL_VI,
  PAYMENT_METHOD_LABEL_VI,
  triageColorClasses,
} from '@/utils/labels';

/**
 * Hồ sơ thú cưng nhìn từ phía nhân viên - tám khối theo FR-04-03 / mục 12.4 SRS:
 * Basic Info → Owner → Medical History → Appointment → Vaccination → Prescription →
 * Laboratory → Invoice.
 *
 * Tab "Tiêm chủng" chưa có dữ liệu thật: bảng tiêm chủng ra đời ở Phase 9. Cấu trúc
 * tab dựng sẵn đúng vị trí để P9 chỉ việc đổ dữ liệu vào, và tab hiện trạng thái rỗng
 * trung thực thay vì số liệu bịa.
 */
type Tab =
  | 'basic'
  | 'owner'
  | 'medical'
  | 'appointments'
  | 'vaccination'
  | 'prescriptions'
  | 'laboratory'
  | 'invoices';

const TABS: { key: Tab; label: string }[] = [
  { key: 'basic', label: 'Thông tin cơ bản' },
  { key: 'owner', label: 'Chủ nuôi' },
  { key: 'medical', label: 'Lịch sử khám' },
  { key: 'appointments', label: 'Lịch hẹn' },
  { key: 'vaccination', label: 'Tiêm chủng' },
  { key: 'prescriptions', label: 'Đơn thuốc' },
  { key: 'laboratory', label: 'Xét nghiệm' },
  { key: 'invoices', label: 'Hóa đơn' },
];

export function StaffPetProfilePage() {
  const { id = '' } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('basic');

  const petQuery = useQuery({
    queryKey: ['pet', id],
    queryFn: () => petsApi.getOne(id),
    enabled: Boolean(id),
  });

  const pet = petQuery.data;

  if (petQuery.isLoading) {
    return <p className="text-muted">Đang tải hồ sơ…</p>;
  }

  if (!pet) {
    return <p className="text-destructive">Không tìm thấy hồ sơ thú cưng.</p>;
  }

  const flags = [...pet.allergies, ...pet.chronicConditions];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {pet.avatarUrl ? (
            <img src={pet.avatarUrl} alt={pet.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-xl">
              🐾
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{pet.name}</h1>
              <span className="rounded bg-surface-muted px-2 py-0.5 font-mono text-sm text-muted">
                {pet.petCode}
              </span>
            </div>
            <p className="text-muted">
              {pet.breed?.breedName ?? '—'}
              {pet.breed?.species ? ` · ${pet.breed.species.speciesName}` : ''}
            </p>
          </div>
        </div>
        <Link
          to="/staff/appointments"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Đặt lịch khám
        </Link>
      </div>

      {/*
        Cảnh báo dị ứng / bệnh mãn tính nằm NGOÀI hệ thống tab và luôn hiển thị: bác sĩ
        phải thấy nó dù đang mở tab nào, không được để nó bị giấu sau một cú bấm.
      */}
      {flags.length > 0 && (
        <section className="rounded border border-destructive/40 bg-destructive/5 p-4">
          <h2 className="text-sm font-semibold text-destructive">⚠ Cảnh báo y tế</h2>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            {pet.allergies.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted">Dị ứng:</span>
                {pet.allergies.map((item) => (
                  <Badge key={item} variant="destructive">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
            {pet.chronicConditions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted">Bệnh mãn tính:</span>
                {pet.chronicConditions.map((item) => (
                  <Badge key={item} variant="warning">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === item.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'basic' && <BasicInfoTab pet={pet} />}
      {tab === 'owner' && <OwnerTab pet={pet} />}
      {tab === 'medical' && <MedicalHistoryTab petId={id} />}
      {tab === 'appointments' && <AppointmentsTab petId={id} />}
      {tab === 'vaccination' && <VaccinationTab />}
      {tab === 'prescriptions' && <PrescriptionsTab petId={id} />}
      {tab === 'laboratory' && <LaboratoryTab petId={id} />}
      {tab === 'invoices' && <InvoicesTab petId={id} />}
    </div>
  );
}

/** Khối 1 - Basic Information. Mã thú cưng / microchip / màu lông thêm ở P2-T1, P2-T2. */
function BasicInfoTab({ pet }: { pet: Pet }) {
  return (
    <section className="rounded border border-border bg-surface p-4">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <Row label="Mã thú cưng" value={pet.petCode} mono />
        <Row label="Tên" value={pet.name} />
        <Row label="Loài" value={pet.breed?.species?.speciesName ?? '—'} />
        <Row label="Giống" value={pet.breed?.breedName ?? '—'} />
        <Row label="Giới tính" value={GENDER_LABEL_VI[pet.gender]} />
        <Row label="Màu lông" value={pet.color ?? '—'} />
        <Row label="Số microchip" value={pet.microchipId ?? 'Chưa gắn chip'} mono={!!pet.microchipId} />
        <Row label="Cân nặng" value={pet.weight != null ? `${pet.weight} kg` : '—'} />
        <Row label="Ngày sinh" value={pet.birthDate ? formatDate(pet.birthDate) : '—'} />
        <Row label="Dị ứng" value={pet.allergies.length > 0 ? pet.allergies.join(', ') : 'Không có'} />
        <Row
          label="Bệnh mãn tính"
          value={pet.chronicConditions.length > 0 ? pet.chronicConditions.join(', ') : 'Không có'}
        />
        <Row label="Ghi chú" value={pet.notes ?? '—'} />
      </dl>
    </section>
  );
}

/** Khối 2 - Owner. */
function OwnerTab({ pet }: { pet: Pet }) {
  if (!pet.owner) {
    return <EmptyState title="Chưa có thông tin chủ nuôi" />;
  }

  return (
    <section className="rounded border border-border bg-surface p-4">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <Row label="Họ tên" value={pet.owner.fullName} />
        <Row label="Số điện thoại" value={pet.owner.phone} />
      </dl>
      <Link
        to={`/staff/customers/${pet.ownerId}`}
        className="mt-4 inline-block text-sm text-primary hover:underline"
      >
        Xem hồ sơ khách hàng →
      </Link>
    </section>
  );
}

/** Khối 3 - Medical History. */
function MedicalHistoryTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pet-medical-history', petId],
    queryFn: () => petsApi.medicalHistory(petId),
  });

  const columns: Column<PetMedicalHistory>[] = [
    { key: 'examinedAt', header: 'Ngày khám', render: (row) => formatDateTime(row.examinedAt) },
    { key: 'doctorName', header: 'Bác sĩ', render: (row) => row.doctorName ?? '—' },
    { key: 'branchName', header: 'Chi nhánh', render: (row) => row.branchName ?? '—' },
    {
      key: 'diagnoses',
      header: 'Chẩn đoán',
      // Từ P4, một hồ sơ có nhiều chẩn đoán; backend đã xếp chẩn đoán chính lên đầu.
      render: (row) =>
        row.diagnoses.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.diagnoses.map((diagnosis) => (
              <Badge key={diagnosis.id} variant={diagnosis.isPrimary ? 'default' : 'outline'}>
                {diagnosis.diseaseName ?? diagnosis.diagnosisText}
              </Badge>
            ))}
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.status === MedicalRecordStatus.COMPLETED ? 'success' : 'warning'}>
          {MEDICAL_RECORD_STATUS_LABEL_VI[row.status]}
        </Badge>
      ),
    },
    {
      key: 'vitals',
      header: 'Sinh hiệu',
      render: (row) =>
        [
          row.temperatureCelsius != null ? `${row.temperatureCelsius}°C` : null,
          row.weightKg != null ? `${row.weightKg} kg` : null,
        ]
          .filter(Boolean)
          .join(' · ') || '—',
    },
    {
      key: 'link',
      header: '',
      render: (row) => (
        <Link
          to={`/staff/appointments/${row.appointmentId}`}
          className="text-sm text-primary hover:underline"
        >
          Xem phiếu khám
        </Link>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.medicalRecordId}
      loading={query.isLoading}
      emptyMessage="Thú cưng chưa có lần khám nào được ghi hồ sơ."
    />
  );
}

/** Khối 4 - Appointment. */
function AppointmentsTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pet-appointments', petId],
    queryFn: () => petsApi.staffAppointments(petId),
  });

  const columns: Column<PetAppointment>[] = [
    { key: 'startAt', header: 'Thời gian', render: (row) => formatDateTime(row.startAt) },
    { key: 'serviceName', header: 'Dịch vụ', render: (row) => row.serviceName ?? '—' },
    { key: 'doctorName', header: 'Bác sĩ', render: (row) => row.doctorName ?? '—' },
    { key: 'branchName', header: 'Chi nhánh', render: (row) => row.branchName ?? '—' },
    {
      key: 'priorityColor',
      header: 'Mức ưu tiên',
      render: (row) =>
        row.priorityColor ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${triageColorClasses(row.priorityColor)}`}
          >
            {PRIORITY_COLOR_LABEL_VI[row.priorityColor]}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => APPOINTMENT_STATUS_LABEL_VI[row.status],
    },
    {
      key: 'link',
      header: '',
      render: (row) => (
        <Link
          to={`/staff/appointments/${row.appointmentId}`}
          className="text-sm text-primary hover:underline"
        >
          Xem lịch hẹn
        </Link>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.appointmentId}
      loading={query.isLoading}
      emptyMessage="Thú cưng chưa có lịch hẹn nào."
    />
  );
}

/** Khối 5 - Vaccination. Chưa có bảng tiêm chủng (Phase 9) - không dựng dữ liệu giả. */
function VaccinationTab() {
  return (
    <EmptyState
      title="Chưa có sổ tiêm chủng"
      description="Quản lý vaccine và lịch tiêm nhắc sẽ có ở Phase 9."
    />
  );
}

/** Khối 6 - Prescription. */
function PrescriptionsTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pet-prescriptions', petId],
    queryFn: () => petsApi.prescriptions(petId),
  });

  if (query.isLoading) {
    return <p className="text-muted">Đang tải đơn thuốc…</p>;
  }

  const prescriptions: PetPrescription[] = query.data ?? [];
  if (prescriptions.length === 0) {
    return <EmptyState title="Thú cưng chưa có đơn thuốc nào." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {prescriptions.map((prescription) => (
        <section key={prescription.prescriptionId} className="rounded border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div>
              <p className="font-medium">{formatDateTime(prescription.examinedAt)}</p>
              <p className="text-sm text-muted">BS. {prescription.doctorName ?? '—'}</p>
            </div>
            <span className="text-sm text-muted">{prescription.items.length} loại thuốc</span>
          </div>
          <ul className="divide-y divide-border">
            {prescription.items.map((item) => (
              <li key={item.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{item.medicationName}</p>
                <p className="text-muted">
                  {item.dosage}
                  {item.unit ? ` (${item.unit})` : ''} · {item.durationDays} ngày
                </p>
                {item.instructions && <p className="mt-1 text-muted">{item.instructions}</p>}
              </li>
            ))}
          </ul>
          {prescription.notes && (
            <p className="border-t border-border px-4 py-3 text-sm text-muted">
              Ghi chú: {prescription.notes}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

/** Khối 7 - Laboratory. */
function LaboratoryTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pet-lab-tests', petId],
    queryFn: () => petsApi.labTests(petId),
  });

  const columns: Column<PetLabTest>[] = [
    { key: 'orderedAt', header: 'Ngày chỉ định', render: (row) => formatDateTime(row.orderedAt) },
    { key: 'testName', header: 'Xét nghiệm' },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => <Badge>{LAB_TEST_STATUS_LABEL_VI[row.status]}</Badge>,
    },
    { key: 'resultText', header: 'Kết quả', render: (row) => row.resultText ?? 'Chưa có kết quả' },
    {
      key: 'files',
      header: 'Tệp',
      render: (row) =>
        row.resultFileUrls.length > 0 ? (
          <div className="flex flex-col gap-1">
            {row.resultFileUrls.map((url, index) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Tệp {index + 1}
              </a>
            ))}
          </div>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.labTestId}
      loading={query.isLoading}
      emptyMessage="Thú cưng chưa có chỉ định xét nghiệm nào."
    />
  );
}

/** Khối 8 - Invoice. */
function InvoicesTab({ petId }: { petId: string }) {
  const query = useQuery({
    queryKey: ['pet-invoices', petId],
    queryFn: () => petsApi.invoices(petId),
  });

  const columns: Column<PetInvoice>[] = [
    { key: 'visitedAt', header: 'Ngày khám', render: (row) => formatDateTime(row.visitedAt) },
    {
      key: 'totalAmount',
      header: 'Số tiền',
      render: (row) => <span className="tabular-nums">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'paid',
      header: 'Thanh toán',
      render: (row) =>
        row.paid ? (
          <div className="flex flex-col gap-0.5">
            <Badge variant="success">
              {row.paymentMethod ? PAYMENT_METHOD_LABEL_VI[row.paymentMethod] : 'Đã thanh toán'}
            </Badge>
            {row.paidAt && <span className="text-xs text-muted">{formatDate(row.paidAt)}</span>}
          </div>
        ) : (
          <Badge variant="destructive">Chưa thanh toán</Badge>
        ),
    },
    {
      key: 'link',
      header: '',
      render: (row) => (
        <Link to={`/staff/billing/${row.invoiceId}`} className="text-sm text-primary hover:underline">
          Xem hóa đơn
        </Link>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={query.data ?? []}
      getRowId={(row) => row.invoiceId}
      loading={query.isLoading}
      emptyMessage="Thú cưng chưa có hóa đơn nào."
    />
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className={mono ? 'font-mono' : undefined}>{value}</dd>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded border border-dashed border-border bg-surface p-8 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  );
}
