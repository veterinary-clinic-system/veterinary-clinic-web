import { ChangeEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addWeeks, format, parseISO, subWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi } from '@/api/doctors.api';
import { speciesApi, petsApi } from '@/api/pets.api';
import { catalogApi } from '@/api/catalog.api';
import { filesApi } from '@/api/files.api';
import { appointmentsApi, CreateBookingPayload } from '@/api/appointments.api';
import { CommonSymptom, COMMON_SYMPTOM_LABEL_VI, Gender, Role, SlotStatus } from '@/types/enums';
import { Appointment, SlotInfo } from '@/types/models';
import { formatCurrency } from '@/utils/format';
import { GENDER_LABEL_VI, getInitial, specializationLabel } from '@/utils/display';
import { getErrorMessage, isConflictError } from '@/utils/errors';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEP_LABELS = ['Chi nhánh', 'Bác sĩ', 'Dịch vụ', 'Thời gian', 'Thông tin', 'Triệu chứng', 'Xác nhận'];

interface NewPetFormState {
  name: string;
  speciesId: string;
  breedId: string;
  gender: Gender;
  weight: string;
  birthDate: string;
}

const emptyNewPet: NewPetFormState = {
  name: '',
  speciesId: '',
  breedId: '',
  gender: Gender.MALE,
  weight: '',
  birthDate: '',
};

interface PhotoItem {
  id: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-none">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Multi-step booking wizard (branch -> doctor -> service -> date/time -> owner/pet ->
 * symptoms -> confirm). Step state lives in plain useState per prompt.md's explicit
 * instruction - no routing-per-step, no external state store.
 */
export function BookingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?.role === Role.PET_OWNER;

  const [step, setStep] = useState<Step>(1);

  // Step 1-3
  const [branchId, setBranchId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [serviceId, setServiceId] = useState('');

  // Step 4
  const [weekOf, setWeekOf] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<(SlotInfo & { dayDate: string }) | null>(null);

  // Step 5
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [email, setEmail] = useState('');
  const [petMode, setPetMode] = useState<'existing' | 'new'>('existing');
  const [petId, setPetId] = useState('');
  const [newPet, setNewPet] = useState<NewPetFormState>(emptyNewPet);

  // Step 6
  const [commonSymptoms, setCommonSymptoms] = useState<CommonSymptom[]>([]);
  const [otherSymptoms, setOtherSymptoms] = useState('');
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);

  // Step 7 / submit
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<Appointment | null>(null);

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: branchesApi.list,
  });

  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors', 'public', branchId],
    queryFn: () => doctorsApi.listPublic(branchId),
    enabled: !!branchId,
  });

  const { data: servicesResult, isLoading: servicesLoading } = useQuery({
    queryKey: ['catalog', 'services'],
    queryFn: () => catalogApi.services({ limit: 100 }),
  });
  const services = (servicesResult?.data ?? []).filter((s) => s.active && s.item.active);

  const calendarQueryKey = ['calendar', 'public', branchId, doctorId, weekOf];
  const {
    data: calendarDays,
    isLoading: calendarLoading,
    isError: calendarError,
  } = useQuery({
    queryKey: calendarQueryKey,
    queryFn: () => appointmentsApi.publicCalendar(branchId, doctorId, weekOf),
    enabled: !!branchId && !!doctorId,
  });

  const { data: myPets } = useQuery({
    queryKey: ['pets', 'mine'],
    queryFn: petsApi.mine,
    enabled: isOwner,
  });

  const { data: speciesList } = useQuery({ queryKey: ['species'], queryFn: speciesApi.list });
  const { data: breeds } = useQuery({
    queryKey: ['breeds', newPet.speciesId],
    queryFn: () => speciesApi.breedsFor(newPet.speciesId),
    enabled: !!newPet.speciesId,
  });

  const selectedBranch = branches?.find((b) => b.id === branchId);
  const selectedDoctor = doctors?.find((d) => d.id === doctorId);
  const selectedService = services.find((s) => s.id === serviceId);
  const hasExistingPets = isOwner && (myPets?.length ?? 0) > 0;
  const effectivePetMode: 'existing' | 'new' = hasExistingPets ? petMode : 'new';
  const selectedExistingPet = myPets?.find((p) => p.id === petId);

  const bookingMutation = useMutation({
    mutationFn: (payload: CreateBookingPayload) => appointmentsApi.createPublicBooking(payload),
  });

  function selectBranch(id: string) {
    setBranchId(id);
    setDoctorId('');
    setSelectedSlot(null);
  }

  function selectDoctor(id: string) {
    setDoctorId(id);
    setSelectedSlot(null);
  }

  function updateNewPet(patch: Partial<NewPetFormState>) {
    setNewPet((prev) => ({ ...prev, ...patch }));
  }

  function toggleSymptom(symptom: CommonSymptom) {
    setCommonSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom],
    );
  }

  function onFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    files.forEach((file) => {
      const id = crypto.randomUUID();
      setPhotoItems((prev) => [...prev, { id, name: file.name, status: 'uploading' }]);
      filesApi
        .upload('symptom-photos', file)
        .then((res) => {
          setPhotoItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'done', url: res.url } : p)));
        })
        .catch(() => {
          setPhotoItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'error' } : p)));
        });
    });
  }

  function removePhoto(id: string) {
    setPhotoItems((prev) => prev.filter((p) => p.id !== id));
  }

  function goToWeek(direction: 'prev' | 'next') {
    const base = parseISO(weekOf);
    const next = direction === 'prev' ? subWeeks(base, 1) : addWeeks(base, 1);
    setWeekOf(format(next, 'yyyy-MM-dd'));
  }

  const canProceed = (() => {
    switch (step) {
      case 1:
        return !!branchId;
      case 2:
        return !!doctorId;
      case 3:
        return !!serviceId;
      case 4:
        return !!selectedSlot;
      case 5:
        if (!phone.trim() || !ownerFullName.trim()) return false;
        if (effectivePetMode === 'existing') return !!petId;
        return newPet.name.trim().length > 0 && !!newPet.breedId;
      default:
        return true;
    }
  })();

  function handleSubmit() {
    if (!selectedSlot || !branchId || !doctorId || !serviceId) return;
    setSubmitError(null);

    const payload: CreateBookingPayload = {
      phone: phone.trim(),
      ownerFullName: ownerFullName.trim(),
      email: email.trim() || undefined,
      branchId,
      doctorId,
      serviceId,
      startAt: selectedSlot.startAt,
      commonSymptoms: commonSymptoms.length > 0 ? commonSymptoms : undefined,
      otherSymptoms: otherSymptoms.trim() || undefined,
      photoUrls: photoItems.filter((p) => p.status === 'done' && p.url).map((p) => p.url as string),
    };

    if (effectivePetMode === 'existing') {
      payload.petId = petId;
    } else {
      payload.newPet = {
        name: newPet.name.trim(),
        breedId: newPet.breedId,
        gender: newPet.gender,
        weight: newPet.weight ? Number(newPet.weight) : undefined,
        birthDate: newPet.birthDate || undefined,
      };
    }

    bookingMutation.mutate(payload, {
      onSuccess: (appointment) => {
        setBookingResult(appointment);
      },
      onError: (error) => {
        setSubmitError(getErrorMessage(error, 'Đặt lịch thất bại. Vui lòng thử lại.'));
        if (isConflictError(error)) {
          void queryClient.invalidateQueries({ queryKey: calendarQueryKey });
          setSelectedSlot(null);
          setStep(4);
        }
      },
    });
  }

  if (bookingResult) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Đặt lịch thành công</h1>
        <p className="mt-2 text-muted">Mã lịch hẹn: {bookingResult.id}</p>
        <dl className="mt-6 rounded border border-border bg-surface p-6 text-left text-sm">
          <SummaryRow
            label="Thời gian"
            value={format(parseISO(bookingResult.startAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })}
          />
          <SummaryRow label="Bác sĩ" value={selectedDoctor?.fullName} />
          <SummaryRow label="Chi nhánh" value={selectedBranch?.branchName} />
          <SummaryRow label="Dịch vụ" value={selectedService?.item.itemName} />
        </dl>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link to="/my/appointments" className="rounded bg-primary px-5 py-2.5 font-medium text-primary-foreground">
              Xem lịch hẹn của tôi
            </Link>
          ) : (
            <Link to="/login" className="rounded bg-primary px-5 py-2.5 font-medium text-primary-foreground">
              Đăng nhập để theo dõi lịch hẹn
            </Link>
          )}
          <Link to="/" className="rounded border border-border px-5 py-2.5 font-medium text-foreground">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Đặt lịch khám</h1>

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = (idx + 1) as Step;
          const isActive = stepNum === step;
          const isDone = stepNum < step;
          return (
            <div
              key={label}
              className={
                'flex items-center gap-1.5 rounded-full px-3 py-1 ' +
                (isActive
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-muted text-muted')
              }
            >
              <span className="font-semibold">{stepNum}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        {/* Step 1: Branch */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Chọn chi nhánh</h2>
            <p className="mt-1 text-sm text-muted">Vui lòng chọn chi nhánh trước - đây là bước bắt buộc trước khi chọn bác sĩ.</p>
            {branchesLoading && <p className="mt-4 text-muted">Đang tải danh sách chi nhánh...</p>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {branches?.map((branch) => (
                <button
                  type="button"
                  key={branch.id}
                  onClick={() => selectBranch(branch.id)}
                  className={
                    'rounded border p-4 text-left transition-colors ' +
                    (branchId === branch.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface hover:border-primary/50')
                  }
                >
                  <p className="font-semibold text-foreground">{branch.branchName}</p>
                  <p className="mt-1 text-sm text-muted">{branch.address}</p>
                  <p className="text-sm text-muted">{branch.phone}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Doctor */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Chọn bác sĩ</h2>
            <p className="mt-1 text-sm text-muted">Bác sĩ đang công tác tại {selectedBranch?.branchName}.</p>
            {doctorsLoading && <p className="mt-4 text-muted">Đang tải danh sách bác sĩ...</p>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {doctors?.map((doctor) => (
                <button
                  type="button"
                  key={doctor.id}
                  onClick={() => selectDoctor(doctor.id)}
                  className={
                    'flex gap-3 rounded border p-4 text-left transition-colors ' +
                    (doctorId === doctor.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface hover:border-primary/50')
                  }
                >
                  {doctor.avatarUrl ? (
                    <img src={doctor.avatarUrl} alt={doctor.fullName} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {getInitial(doctor.fullName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{doctor.fullName}</p>
                    {doctor.yearOfStart && (
                      <p className="text-xs text-muted">Hành nghề từ năm {doctor.yearOfStart}</p>
                    )}
                    {doctor.specialization.length > 0 && (
                      <p className="mt-1 text-xs text-muted">
                        {doctor.specialization.map((s) => specializationLabel(s)).join(', ')}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {doctors && doctors.length === 0 && (
              <p className="mt-4 text-muted">Chi nhánh này hiện chưa có bác sĩ nào.</p>
            )}
          </div>
        )}

        {/* Step 3: Service */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Chọn dịch vụ</h2>
            {servicesLoading && <p className="mt-4 text-muted">Đang tải danh sách dịch vụ...</p>}
            <div className="mt-4 space-y-3">
              {services.map((service) => (
                <button
                  type="button"
                  key={service.id}
                  onClick={() => setServiceId(service.id)}
                  className={
                    'flex w-full items-center justify-between rounded border p-4 text-left transition-colors ' +
                    (serviceId === service.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface hover:border-primary/50')
                  }
                >
                  <div>
                    <p className="font-medium text-foreground">{service.item.itemName}</p>
                    {service.item.describe && <p className="mt-0.5 text-sm text-muted">{service.item.describe}</p>}
                    <p className="mt-0.5 text-xs text-muted">{service.durationMinutes} phút</p>
                  </div>
                  <p className="whitespace-nowrap font-semibold text-primary">
                    {formatCurrency(service.item.unitPrice)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Date & time */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Chọn ngày và giờ khám</h2>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToWeek('prev')}
                className="rounded border border-border px-3 py-1.5 text-sm text-foreground"
              >
                ← Tuần trước
              </button>
              <button
                type="button"
                onClick={() => goToWeek('next')}
                className="rounded border border-border px-3 py-1.5 text-sm text-foreground"
              >
                Tuần sau →
              </button>
            </div>

            {calendarLoading && <p className="mt-4 text-muted">Đang tải lịch khám...</p>}
            {calendarError && <p className="mt-4 text-destructive">Không thể tải lịch khám. Vui lòng thử lại.</p>}

            {calendarDays && calendarDays.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border-b border-border p-2 text-left text-muted">Giờ</th>
                      {calendarDays.map((day) => (
                        <th key={day.date} className="border-b border-border p-2 text-center font-medium text-foreground">
                          {format(parseISO(day.date), 'EEEE dd/MM', { locale: vi })}
                          {!day.isBranchOpen && <div className="text-xs font-normal text-muted">(Đóng cửa)</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set(calendarDays.flatMap((d) => d.slots.map((s) => s.start))))
                      .sort()
                      .map((time) => (
                        <tr key={time}>
                          <td className="border-b border-border p-2 text-muted">{time}</td>
                          {calendarDays.map((day) => {
                            const slot = day.slots.find((s) => s.start === time);
                            if (!slot) {
                              return (
                                <td key={day.date} className="border-b border-border p-1 text-center text-muted">
                                  —
                                </td>
                              );
                            }
                            const isFree = slot.status === SlotStatus.FREE;
                            const isSelected = selectedSlot?.startAt === slot.startAt;
                            return (
                              <td key={day.date} className="border-b border-border p-1 text-center">
                                <button
                                  type="button"
                                  disabled={!isFree}
                                  onClick={() => setSelectedSlot({ ...slot, dayDate: day.date })}
                                  className={
                                    'w-full rounded px-2 py-1.5 text-xs font-medium ' +
                                    (isSelected
                                      ? 'bg-primary text-primary-foreground'
                                      : isFree
                                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                        : 'cursor-not-allowed bg-surface-muted text-muted')
                                  }
                                >
                                  {time}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
                {calendarDays.every((d) => d.slots.length === 0) && (
                  <p className="mt-3 text-muted">Không có khung giờ nào trong tuần này.</p>
                )}
              </div>
            )}

            <div className="mt-3 flex gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-primary/20" /> Còn trống
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded border border-border bg-surface-muted" /> Không khả dụng
              </span>
            </div>

            {selectedSlot && (
              <p className="mt-4 rounded bg-primary/10 px-3 py-2 text-sm text-primary">
                Đã chọn: {format(parseISO(selectedSlot.startAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })}
              </p>
            )}
          </div>
        )}

        {/* Step 5: Owner + pet */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Thông tin chủ nuôi và thú cưng</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Số điện thoại *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Họ và tên *</label>
                <input
                  type="text"
                  value={ownerFullName}
                  onChange={(e) => setOwnerFullName(e.target.value)}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-foreground">Email (không bắt buộc)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
                />
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <p className="font-medium text-foreground">Thú cưng</p>

              {/*
                TODO(booking-handoff): when arriving from PetProfilePage's "Đặt lịch khám
                cho [tên]" button (src/pages/owner/PetProfilePage.tsx), `location.state.petId`
                carries the preselected pet id. Reading it to auto-select the pet here and
                skip this step is intentionally not wired up yet - out of scope for this pass.
              */}

              {hasExistingPets && (
                <div className="mt-2 flex gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setPetMode('existing')}
                    className={
                      'rounded px-3 py-1.5 ' +
                      (petMode === 'existing' ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-muted')
                    }
                  >
                    Chọn thú cưng đã có
                  </button>
                  <button
                    type="button"
                    onClick={() => setPetMode('new')}
                    className={
                      'rounded px-3 py-1.5 ' +
                      (petMode === 'new' ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-muted')
                    }
                  >
                    Thêm thú cưng mới
                  </button>
                </div>
              )}

              {effectivePetMode === 'existing' ? (
                <div className="mt-3 space-y-2">
                  {myPets?.map((pet) => (
                    <label
                      key={pet.id}
                      className={
                        'flex cursor-pointer items-center gap-2 rounded border p-3 text-sm ' +
                        (petId === pet.id ? 'border-primary bg-primary/5' : 'border-border')
                      }
                    >
                      <input
                        type="radio"
                        name="petId"
                        checked={petId === pet.id}
                        onChange={() => setPetId(pet.id)}
                      />
                      <span className="text-foreground">{pet.name}</span>
                      {pet.breed?.breedName && <span className="text-muted">· {pet.breed.breedName}</span>}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Tên thú cưng *</label>
                    <input
                      type="text"
                      value={newPet.name}
                      onChange={(e) => updateNewPet({ name: e.target.value })}
                      className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Giới tính</label>
                    <select
                      value={newPet.gender}
                      onChange={(e) => updateNewPet({ gender: e.target.value as Gender })}
                      className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
                    >
                      {Object.values(Gender).map((g) => (
                        <option key={g} value={g}>
                          {GENDER_LABEL_VI[g]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Loài</label>
                    <select
                      value={newPet.speciesId}
                      onChange={(e) => updateNewPet({ speciesId: e.target.value, breedId: '' })}
                      className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
                    >
                      <option value="">-- Chọn loài --</option>
                      {speciesList?.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.speciesName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Giống *</label>
                    <select
                      value={newPet.breedId}
                      onChange={(e) => updateNewPet({ breedId: e.target.value })}
                      disabled={!newPet.speciesId}
                      className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground disabled:opacity-60"
                    >
                      <option value="">-- Chọn giống --</option>
                      {breeds?.map((breed) => (
                        <option key={breed.id} value={breed.id}>
                          {breed.breedName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Cân nặng (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newPet.weight}
                      onChange={(e) => updateNewPet({ weight: e.target.value })}
                      className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Ngày sinh</label>
                    <input
                      type="date"
                      value={newPet.birthDate}
                      onChange={(e) => updateNewPet({ birthDate: e.target.value })}
                      className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Symptoms */}
        {step === 6 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Triệu chứng</h2>
            <p className="mt-1 text-sm text-muted">Thông tin này giúp bác sĩ chuẩn bị tốt hơn trước buổi khám (không bắt buộc).</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.values(CommonSymptom).map((symptom) => (
                <label
                  key={symptom}
                  className="flex items-center gap-2 rounded border border-border p-2.5 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={commonSymptoms.includes(symptom)}
                    onChange={() => toggleSymptom(symptom)}
                  />
                  {COMMON_SYMPTOM_LABEL_VI[symptom]}
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-foreground">Mô tả triệu chứng khác</label>
              <textarea
                value={otherSymptoms}
                onChange={(e) => setOtherSymptoms(e.target.value)}
                rows={3}
                className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
                placeholder="Mô tả thêm về tình trạng của thú cưng..."
              />
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-foreground">Hình ảnh đính kèm (không bắt buộc)</label>
              <input type="file" multiple accept="image/*" onChange={onFilesSelected} className="text-sm text-muted" />
              {photoItems.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {photoItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 rounded bg-surface-muted px-3 py-1.5">
                      <span className="truncate text-foreground">{item.name}</span>
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span
                          className={
                            item.status === 'done'
                              ? 'text-primary'
                              : item.status === 'error'
                                ? 'text-destructive'
                                : 'text-muted'
                          }
                        >
                          {item.status === 'uploading' && 'Đang tải lên...'}
                          {item.status === 'done' && 'Xong'}
                          {item.status === 'error' && 'Lỗi tải lên'}
                        </span>
                        <button type="button" onClick={() => removePhoto(item.id)} className="text-muted underline">
                          Xóa
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Step 7: Review & confirm */}
        {step === 7 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Xác nhận thông tin đặt lịch</h2>
            <dl className="mt-4 rounded border border-border bg-surface p-4 text-sm">
              <SummaryRow label="Chi nhánh" value={selectedBranch?.branchName} />
              <SummaryRow label="Bác sĩ" value={selectedDoctor?.fullName} />
              <SummaryRow
                label="Dịch vụ"
                value={selectedService ? `${selectedService.item.itemName} (${formatCurrency(selectedService.item.unitPrice)})` : undefined}
              />
              <SummaryRow
                label="Thời gian"
                value={
                  selectedSlot
                    ? format(parseISO(selectedSlot.startAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })
                    : undefined
                }
              />
              <SummaryRow label="Người đặt" value={`${ownerFullName} - ${phone}${email ? ` - ${email}` : ''}`} />
              <SummaryRow
                label="Thú cưng"
                value={
                  effectivePetMode === 'existing'
                    ? selectedExistingPet?.name
                    : newPet.name
                      ? `${newPet.name} (thú cưng mới)`
                      : undefined
                }
              />
              <SummaryRow
                label="Triệu chứng"
                value={
                  commonSymptoms.length > 0
                    ? commonSymptoms.map((s) => COMMON_SYMPTOM_LABEL_VI[s]).join(', ')
                    : 'Không có'
                }
              />
              {otherSymptoms && <SummaryRow label="Mô tả thêm" value={otherSymptoms} />}
              <SummaryRow
                label="Ảnh đính kèm"
                value={`${photoItems.filter((p) => p.status === 'done').length} ảnh`}
              />
            </dl>

            {submitError && <p className="mt-3 text-sm text-destructive">{submitError}</p>}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="rounded border border-border px-5 py-2 font-medium text-foreground"
          >
            Quay lại
          </button>
        ) : (
          <span />
        )}

        {step < 7 ? (
          <button
            type="button"
            disabled={!canProceed}
            onClick={() => setStep((s) => (s + 1) as Step)}
            className="rounded bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-50"
          >
            Tiếp theo
          </button>
        ) : (
          <button
            type="button"
            disabled={bookingMutation.isPending}
            onClick={handleSubmit}
            className="rounded bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-50"
          >
            {bookingMutation.isPending ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
          </button>
        )}
      </div>
    </div>
  );
}
