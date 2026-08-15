import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { appointmentsApi } from '@/api/appointments.api';
import { branchesApi } from '@/api/branches.api';
import { catalogApi } from '@/api/catalog.api';
import { doctorsApi } from '@/api/doctors.api';
import { filesApi } from '@/api/files.api';
import { petsApi, speciesApi } from '@/api/pets.api';
import { queueApi, WalkInPayload } from '@/api/queue.api';
import {
  Badge,
  Button,
  CheckboxGroup,
  Input,
  Modal,
  Select,
  Table,
  Textarea,
  usePagination,
  useToast,
} from '@/components/basic';
import type { Column } from '@/components/basic';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  Appointment,
  AppointmentStatus,
  CommonSymptom,
  COMMON_SYMPTOM_LABEL_VI,
  Gender,
  PriorityColor,
  PRIORITY_COLOR_LABEL_VI,
  QueueEntry,
  QueueSource,
  QueueStatus,
  QUEUE_SOURCE_LABEL_VI,
  QUEUE_STATUS_LABEL_VI,
} from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { GENDER_LABEL_VI } from '@/utils/display';
import { formatTime } from '@/utils/format';
import { triageColorClasses } from '@/utils/labels';

const today = () => format(new Date(), 'yyyy-MM-dd');

const PAGE_SIZE = 20;

/** Trạng thái lịch hẹn còn "chờ khách đến" - đủ điều kiện để lễ tân bấm check-in. */
const CHECK_IN_ELIGIBLE = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

/**
 * Quầy lễ tân - hàng chờ trong ngày. Bốn thao tác của nhân viên:
 * xác nhận khách đã đến, tạo lượt khám không đặt lịch, đưa vào hàng chờ (cả hai thao
 * tác trên đều tạo một lượt chờ), và gán bác sĩ.
 */
export function QueuePage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(today());
  const [showFinished, setShowFinished] = useState(false);

  const [walkInOpen, setWalkInOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<QueueEntry | null>(null);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  // Chi nhánh đầu tiên được chọn sẵn để lễ tân mở trang là thấy hàng chờ ngay.
  useEffect(() => {
    if (!branchId && branchesQuery.data?.length) {
      setBranchId(branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data]);

  const queueParams = {
    branchId: branchId || undefined,
    date,
    status: showFinished ? Object.values(QueueStatus) : undefined,
  };

  const queueQuery = useQuery({
    queryKey: ['queue', queueParams],
    queryFn: () => queueApi.list(queueParams),
    enabled: Boolean(branchId),
    // Nhiều người cùng đứng ở quầy - làm mới định kỳ để không gọi trùng số thứ tự.
    refetchInterval: 30_000,
  });

  function invalidateQueue() {
    void queryClient.invalidateQueries({ queryKey: ['queue'] });
    void queryClient.invalidateQueries({ queryKey: ['staff-appointments'] });
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: QueueStatus; reason?: string }) =>
      queueApi.update(id, { status, reason }),
    onSuccess: (entry) => {
      toast.show(`Số ${entry.ticketNumber}: ${QUEUE_STATUS_LABEL_VI[entry.status]}.`, 'success');
      invalidateQueue();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  /**
   * Hủy lượt chờ kéo theo lịch hẹn sang "đã hủy" và ghi lý do (FR-05-04). Hỏi lý do
   * bằng prompt để không phải dựng thêm một modal nữa cho một ô nhập duy nhất; bỏ
   * trống vẫn hủy được, backend điền "Khách bỏ về trước khi được khám".
   */
  function cancelQueueEntry(entry: QueueEntry) {
    const reason = window.prompt(
      `Hủy lượt chờ số ${entry.ticketNumber} (${entry.pet?.name ?? 'thú cưng'}). Lý do:`,
      'Khách bỏ về trước khi được khám',
    );
    if (reason === null) return; // bấm Cancel
    updateMutation.mutate({ id: entry.id, status: QueueStatus.CANCELLED, reason: reason.trim() });
  }

  const columns: Column<QueueEntry>[] = [
    {
      key: 'ticketNumber',
      header: 'STT',
      render: (row) => <span className="text-lg font-semibold tabular-nums">{row.ticketNumber}</span>,
    },
    {
      key: 'pet',
      header: 'Thú cưng / Chủ nuôi',
      render: (row) => (
        <div className="flex flex-col">
          <Link
            to={`/staff/patients/${row.petId}`}
            className="font-medium text-primary hover:underline"
          >
            {row.pet?.name ?? '—'}
          </Link>
          <span className="text-xs text-muted">
            {row.pet?.owner?.fullName ?? '—'} · {row.pet?.owner?.phone ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Nguồn',
      render: (row) => (
        <Badge variant={row.source === QueueSource.WALK_IN ? 'warning' : 'default'}>
          {QUEUE_SOURCE_LABEL_VI[row.source]}
        </Badge>
      ),
    },
    {
      key: 'priorityColor',
      header: 'Ưu tiên',
      render: (row) =>
        row.priorityColor ? (
          <span className={`rounded px-2 py-0.5 text-xs ${triageColorClasses(row.priorityColor)}`}>
            {PRIORITY_COLOR_LABEL_VI[row.priorityColor]}
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'service', header: 'Dịch vụ', render: (row) => row.service?.item?.itemName ?? '—' },
    {
      key: 'doctor',
      header: 'Bác sĩ',
      render: (row) =>
        row.doctor ? (
          <span>{row.doctor.fullName}</span>
        ) : (
          <span className="text-muted">Chưa gán</span>
        ),
    },
    {
      key: 'checkedInAt',
      header: 'Vào lúc',
      render: (row) => formatTime(row.checkedInAt),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => <Badge variant={statusVariant(row.status)}>{QUEUE_STATUS_LABEL_VI[row.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {!isFinished(row.status) && (
            <Button size="sm" variant="secondary" onClick={() => setAssignTarget(row)}>
              {row.doctorId ? 'Đổi bác sĩ' : 'Gán bác sĩ'}
            </Button>
          )}
          {row.status === QueueStatus.ASSIGNED && (
            <Button
              size="sm"
              onClick={() => updateMutation.mutate({ id: row.id, status: QueueStatus.IN_ROOM })}
            >
              Gọi vào phòng
            </Button>
          )}
          {row.status === QueueStatus.IN_ROOM && (
            <>
              {row.appointmentId && (
                <Link
                  to={`/staff/appointments/${row.appointmentId}/exam`}
                  className="inline-flex h-8 items-center rounded border border-border px-3 text-sm hover:bg-surface-muted"
                >
                  Phiếu khám
                </Link>
              )}
              <Button
                size="sm"
                onClick={() => updateMutation.mutate({ id: row.id, status: QueueStatus.DONE })}
              >
                Khám xong
              </Button>
            </>
          )}
          {!isFinished(row.status) && (
            <Button size="sm" variant="ghost" onClick={() => cancelQueueEntry(row)}>
              Hủy lượt
            </Button>
          )}
        </div>
      ),
    },
  ];

  const entries = queueQuery.data ?? [];
  const waiting = entries.filter((e) => e.status === QueueStatus.WAITING).length;
  const inRoom = entries.filter((e) => e.status === QueueStatus.IN_ROOM).length;

  // Hàng chờ một ngày của một chi nhánh trả về trong một lần gọi - cắt trang ở client
  // giữ nguyên thứ tự ưu tiên backend đã sắp.
  const { page, setPage, pageItems } = usePagination(entries, PAGE_SIZE, [
    branchId,
    date,
    showFinished,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Hàng chờ</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCheckInOpen(true)} disabled={!branchId}>
            Xác nhận khách đã đến
          </Button>
          <Button onClick={() => setWalkInOpen(true)} disabled={!branchId}>
            Khách vãng lai
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={setBranchId}
          options={(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName }))}
          placeholder="— Chọn chi nhánh —"
        />
        <Input label="Ngày" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <label className="flex h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showFinished}
            onChange={(e) => setShowFinished(e.target.checked)}
          />
          Hiện cả lượt đã kết thúc
        </label>
        <div className="ml-auto flex gap-4 text-sm text-muted">
          <span>
            Đang chờ: <strong className="text-foreground">{waiting}</strong>
          </span>
          <span>
            Trong phòng: <strong className="text-foreground">{inRoom}</strong>
          </span>
        </div>
      </div>

      <Table
        columns={columns}
        data={pageItems}
        getRowId={(row) => row.id}
        loading={queueQuery.isLoading}
        emptyMessage={branchId ? 'Hàng chờ đang trống.' : 'Chọn một chi nhánh để xem hàng chờ.'}
        page={page}
        limit={PAGE_SIZE}
        total={entries.length}
        onPageChange={setPage}
      />

      <CheckInModal
        open={checkInOpen}
        branchId={branchId}
        date={date}
        onClose={() => setCheckInOpen(false)}
        onDone={invalidateQueue}
      />

      <WalkInModal
        open={walkInOpen}
        branchId={branchId}
        onClose={() => setWalkInOpen(false)}
        onDone={invalidateQueue}
      />

      <AssignDoctorModal
        entry={assignTarget}
        onClose={() => setAssignTarget(null)}
        onDone={invalidateQueue}
      />
    </div>
  );
}

// -------------------------------------------------------------------------------------
// Xác nhận khách đã đến
// -------------------------------------------------------------------------------------

function CheckInModal({
  open,
  branchId,
  date,
  onClose,
  onDone,
}: {
  open: boolean;
  branchId: string;
  date: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [priorityColor, setPriorityColor] = useState<string>('');

  const appointmentsQuery = useQuery({
    queryKey: ['staff-appointments', 'check-in', branchId, date],
    queryFn: () =>
      appointmentsApi.list({
        branchId,
        date,
        limit: 100,
        sortBy: 'startAt',
        sortOrder: 'ASC',
      }),
    enabled: open && Boolean(branchId),
  });

  const checkInMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      queueApi.checkIn({
        appointmentId,
        priorityColor: (priorityColor || undefined) as PriorityColor | undefined,
      }),
    onSuccess: (entry) => {
      toast.show(`Đã check-in — số thứ tự ${entry.ticketNumber}.`, 'success');
      onDone();
      onClose();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const pending = (appointmentsQuery.data?.data ?? []).filter((a) =>
    CHECK_IN_ELIGIBLE.includes(a.status),
  );

  const columns: Column<Appointment>[] = [
    { key: 'startAt', header: 'Giờ hẹn', render: (row) => formatTime(row.startAt) },
    { key: 'pet', header: 'Thú cưng', render: (row) => row.pet?.name ?? '—' },
    {
      key: 'owner',
      header: 'Chủ nuôi',
      render: (row) => `${row.pet?.owner?.fullName ?? '—'} · ${row.pet?.owner?.phone ?? '—'}`,
    },
    { key: 'doctor', header: 'Bác sĩ', render: (row) => row.doctor?.fullName ?? '—' },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          size="sm"
          loading={checkInMutation.isPending && checkInMutation.variables === row.id}
          onClick={() => checkInMutation.mutate(row.id)}
        >
          Đã đến
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Lịch hẹn ngày ${date} chưa check-in`}
      className="max-w-4xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Mức ưu tiên gán khi check-in (tùy chọn)"
          value={priorityColor}
          onChange={setPriorityColor}
          options={[
            { value: '', label: 'Giữ nguyên mức của lịch hẹn' },
            ...Object.values(PriorityColor).map((color) => ({
              value: color,
              label: PRIORITY_COLOR_LABEL_VI[color],
            })),
          ]}
        />
        <Table
          columns={columns}
          data={pending}
          getRowId={(row) => row.id}
          loading={appointmentsQuery.isLoading}
          emptyMessage="Không còn lịch hẹn nào chờ check-in trong ngày."
        />
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------------------------------
// Khách vãng lai
// -------------------------------------------------------------------------------------

interface WalkInFormState {
  phone: string;
  ownerFullName: string;
  petId: string;
  petName: string;
  speciesId: string;
  breedId: string;
  gender: Gender;
  serviceId: string;
  doctorId: string;
  priorityColor: string;
  commonSymptoms: CommonSymptom[];
  reason: string;
  photoUrls: string[];
}

const EMPTY_WALK_IN: WalkInFormState = {
  phone: '',
  ownerFullName: '',
  petId: '',
  petName: '',
  speciesId: '',
  breedId: '',
  gender: Gender.MALE,
  serviceId: '',
  doctorId: '',
  priorityColor: '',
  commonSymptoms: [],
  reason: '',
  photoUrls: [],
};

function WalkInModal({
  open,
  branchId,
  onClose,
  onDone,
}: {
  open: boolean;
  branchId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<WalkInFormState>(EMPTY_WALK_IN);
  const [uploading, setUploading] = useState(false);
  const debouncedPhone = useDebouncedValue(form.phone, 400);

  const servicesQuery = useQuery({
    queryKey: ['services', 'walk-in'],
    queryFn: () => catalogApi.services({ limit: 100 }),
    enabled: open,
  });
  const doctorsQuery = useQuery({
    queryKey: ['doctors-public', branchId],
    queryFn: () => doctorsApi.listPublic(branchId),
    enabled: open && Boolean(branchId),
  });
  const speciesQuery = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesApi.list(),
    enabled: open,
  });
  const breedsQuery = useQuery({
    queryKey: ['breeds', form.speciesId],
    queryFn: () => speciesApi.breedsFor(form.speciesId),
    enabled: open && Boolean(form.speciesId),
  });

  // Gõ số điện thoại là tra ngay hồ sơ thú cưng đã có - phần lớn "khách vãng lai" là
  // khách cũ chỉ không đặt lịch, chứ không phải khách mới hoàn toàn.
  const existingPetsQuery = useQuery({
    queryKey: ['walk-in-pets', debouncedPhone],
    queryFn: () => petsApi.search({ search: debouncedPhone, limit: 20 }),
    enabled: open && debouncedPhone.length >= 8,
  });
  const existingPets = existingPetsQuery.data?.data ?? [];

  const walkInMutation = useMutation({
    mutationFn: () => {
      const payload: WalkInPayload = {
        branchId,
        serviceId: form.serviceId,
        doctorId: form.doctorId || undefined,
        phone: form.phone,
        priorityColor: (form.priorityColor || undefined) as PriorityColor | undefined,
        commonSymptoms: form.commonSymptoms.length > 0 ? form.commonSymptoms : undefined,
        reason: form.reason || undefined,
        photoUrls: form.photoUrls.length > 0 ? form.photoUrls : undefined,
      };
      if (form.petId) {
        payload.petId = form.petId;
      } else {
        payload.ownerFullName = form.ownerFullName;
        payload.newPet = {
          name: form.petName,
          speciesId: form.speciesId || undefined,
          breedId: form.breedId,
          gender: form.gender,
        };
      }
      return queueApi.walkIn(payload);
    },
    onSuccess: (entry) => {
      // Backend đã cố xếp luôn một bác sĩ + khung giờ; chỉ khi hết chỗ lượt mới nằm
      // lại ở hàng chờ. Thông báo phải nói rõ khách được xếp giờ hay phải chờ.
      const scheduled = entry.doctor && entry.appointment;
      toast.show(
        scheduled
          ? `Số thứ tự ${entry.ticketNumber} — đã xếp bác sĩ ${entry.doctor!.fullName} lúc ${formatTime(
              entry.appointment!.startAt,
            )}.`
          : `Số thứ tự ${entry.ticketNumber} — hiện không còn bác sĩ trống, khách được đưa vào hàng chờ.`,
        scheduled ? 'success' : 'info',
      );
      setForm(EMPTY_WALK_IN);
      onDone();
      onClose();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    walkInMutation.mutate();
  }

  /** Tải ảnh lên ngay khi chọn - biểu mẫu chỉ giữ URL, giống trang đặt lịch. */
  async function onPhotosSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map((file) =>
          filesApi
            .upload('symptom-photos', file)
            .then((res) => res.url)
            .catch(() => null),
        ),
      );
      const urls = uploaded.filter((url): url is string => !!url);
      if (urls.length < files.length) {
        toast.show('Một số ảnh tải lên không thành công.', 'error');
      }
      setForm((prev) => ({ ...prev, photoUrls: [...prev.photoUrls, ...urls].slice(0, 6) }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tạo lượt khám không đặt lịch"
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="walk-in-form" loading={walkInMutation.isPending}>
            Đưa vào hàng chờ
          </Button>
        </>
      }
    >
      <form id="walk-in-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Số điện thoại chủ nuôi"
          type="tel"
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value, petId: '' })}
          hint="Nhập số để tra hồ sơ thú cưng đã có."
        />

        {existingPets.length > 0 && (
          <Select
            label="Thú cưng đã có hồ sơ"
            value={form.petId}
            onChange={(value) => setForm({ ...form, petId: value })}
            options={[
              { value: '', label: '— Thú cưng mới, chưa có hồ sơ —' },
              ...existingPets.map((pet) => ({
                value: pet.id,
                label: `${pet.name}${pet.breed ? ` (${pet.breed.breedName})` : ''} — ${pet.owner?.fullName ?? ''}`,
              })),
            ]}
          />
        )}

        {!form.petId && (
          <div className="flex flex-col gap-4 rounded border border-border p-3">
            <p className="text-sm font-medium">Hồ sơ mới</p>
            <Input
              label="Họ tên chủ nuôi"
              required
              value={form.ownerFullName}
              onChange={(e) => setForm({ ...form, ownerFullName: e.target.value })}
            />
            <Input
              label="Tên thú cưng"
              required
              value={form.petName}
              onChange={(e) => setForm({ ...form, petName: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select
                label="Loài"
                value={form.speciesId}
                onChange={(value) => setForm({ ...form, speciesId: value, breedId: '' })}
                options={(speciesQuery.data ?? []).map((s) => ({
                  value: s.id,
                  label: s.speciesName,
                }))}
                placeholder="— Chọn loài —"
              />
              <Select
                label="Giống"
                value={form.breedId}
                onChange={(value) => setForm({ ...form, breedId: value })}
                options={(breedsQuery.data ?? []).map((b) => ({
                  value: b.id,
                  label: b.breedName,
                }))}
                placeholder="— Chọn giống —"
                disabled={!form.speciesId}
              />
              <Select
                label="Giới tính"
                value={form.gender}
                onChange={(value) => setForm({ ...form, gender: value as Gender })}
                options={Object.values(Gender).map((g) => ({
                  value: g,
                  label: GENDER_LABEL_VI[g],
                }))}
              />
            </div>
          </div>
        )}

        <Select
          label="Dịch vụ"
          value={form.serviceId}
          onChange={(value) => setForm({ ...form, serviceId: value })}
          options={(servicesQuery.data?.data ?? [])
            .filter((s) => s.active)
            .map((s) => ({
              value: s.id,
              label: `${s.item.itemName} (${s.durationMinutes} phút)`,
            }))}
          placeholder="— Chọn dịch vụ —"
          required
        />

        <Select
          label="Bác sĩ (tùy chọn)"
          value={form.doctorId}
          onChange={(value) => setForm({ ...form, doctorId: value })}
          options={[
            { value: '', label: 'Tự động — hệ thống chọn bác sĩ trống sớm nhất' },
            ...(doctorsQuery.data ?? []).map((d) => ({ value: d.id, label: d.fullName })),
          ]}
          hint="Để tự động: hệ thống xếp luôn khung giờ trống sớm nhất của cả chi nhánh; hết chỗ thì khách mới vào hàng chờ."
        />

        <Select
          label="Mức ưu tiên"
          value={form.priorityColor}
          onChange={(value) => setForm({ ...form, priorityColor: value })}
          options={[
            { value: '', label: 'Chưa phân loại' },
            ...Object.values(PriorityColor).map((color) => ({
              value: color,
              label: PRIORITY_COLOR_LABEL_VI[color],
            })),
          ]}
          hint="Chọn “Đỏ — Cấp cứu” khi hết chỗ: hệ thống sẽ dời một ca nhẹ hơn để lấy khung giờ."
        />

        {/*
          Phần khai triệu chứng dựng GIỐNG biểu mẫu đặt lịch công khai (phản hồi
          nghiệm thu: "Cách điền triệu chứng giống với khi điền form gửi") - cùng danh
          sách triệu chứng thường gặp, cùng ô mô tả, cùng chỗ đính kèm ảnh.
        */}
        <CheckboxGroup
          label="Triệu chứng thường gặp"
          value={form.commonSymptoms}
          onChange={(value) => setForm({ ...form, commonSymptoms: value as CommonSymptom[] })}
          options={Object.values(CommonSymptom).map((symptom) => ({
            value: symptom,
            label: COMMON_SYMPTOM_LABEL_VI[symptom],
          }))}
          className="sm:grid sm:grid-cols-2 sm:gap-x-4"
        />

        <Textarea
          label="Lý do khám / triệu chứng"
          rows={3}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Mô tả thêm về tình trạng của thú cưng..."
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Hình ảnh đính kèm (tối đa 6)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={uploading}
            onChange={onPhotosSelected}
            className="text-sm text-muted"
          />
          {uploading && <p className="mt-1 text-xs text-muted">Đang tải ảnh lên...</p>}
          {form.photoUrls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {form.photoUrls.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="" className="h-16 w-16 rounded border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        photoUrls: prev.photoUrls.filter((u) => u !== url),
                      }))
                    }
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white"
                    aria-label="Xóa ảnh"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

// -------------------------------------------------------------------------------------
// Gán bác sĩ
// -------------------------------------------------------------------------------------

function AssignDoctorModal({
  entry,
  onClose,
  onDone,
}: {
  entry: QueueEntry | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [doctorId, setDoctorId] = useState('');
  const [startAt, setStartAt] = useState('');

  useEffect(() => {
    setDoctorId(entry?.doctorId ?? '');
    setStartAt('');
  }, [entry]);

  const doctorsQuery = useQuery({
    queryKey: ['doctors-public', entry?.branchId],
    queryFn: () => doctorsApi.listPublic(entry!.branchId),
    enabled: Boolean(entry),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      queueApi.assignDoctor(entry!.id, {
        doctorId,
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
      }),
    onSuccess: (updated) => {
      toast.show(`Đã gán bác sĩ ${updated.doctor?.fullName ?? ''}.`, 'success');
      onDone();
      onClose();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  return (
    <Modal
      open={Boolean(entry)}
      onClose={onClose}
      title={entry ? `Gán bác sĩ — số thứ tự ${entry.ticketNumber}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!doctorId}
            loading={assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          >
            Xác nhận
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {entry?.pet?.name} — {entry?.service?.item?.itemName}
        </p>
        <Select
          label="Bác sĩ"
          value={doctorId}
          onChange={setDoctorId}
          options={(doctorsQuery.data ?? []).map((d) => ({ value: d.id, label: d.fullName }))}
          placeholder="— Chọn bác sĩ —"
        />
        <Input
          label="Giờ khám (tùy chọn)"
          type="date"
          value={startAt.slice(0, 10)}
          onChange={(e) =>
            setStartAt(e.target.value ? `${e.target.value}T${startAt.slice(11) || '09:00'}` : '')
          }
          hint="Bỏ trống để hệ thống tự chọn khung giờ trống sớm nhất còn lại hôm nay."
        />
        {startAt && (
          <Input
            label="Giờ bắt đầu"
            value={startAt.slice(11)}
            onChange={(e) => setStartAt(`${startAt.slice(0, 10)}T${e.target.value}`)}
            placeholder="HH:mm"
          />
        )}
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------------------------------

function isFinished(status: QueueStatus): boolean {
  return status === QueueStatus.DONE || status === QueueStatus.CANCELLED;
}

function statusVariant(status: QueueStatus): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case QueueStatus.WAITING:
      return 'warning';
    case QueueStatus.ASSIGNED:
      return 'default';
    case QueueStatus.IN_ROOM:
      return 'default';
    case QueueStatus.DONE:
      return 'success';
    case QueueStatus.CANCELLED:
      return 'destructive';
  }
}
