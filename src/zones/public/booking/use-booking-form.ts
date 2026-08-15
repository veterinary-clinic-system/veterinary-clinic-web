import { ChangeEvent, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addWeeks, format, parseISO, startOfDay, subWeeks } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi, usersApi } from '@/api/doctors.api';
import { petsApi, speciesApi } from '@/api/pets.api';
import { catalogApi } from '@/api/catalog.api';
import { filesApi } from '@/api/files.api';
import { appointmentsApi, CreateBookingPayload } from '@/api/appointments.api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { CommonSymptom, Role, SlotStatus } from '@/types/enums';
import { Appointment } from '@/types/models';
import { getErrorMessage, isConflictError } from '@/utils/errors';
import {
  BookingHandoffState,
  EMPTY_NEW_PET,
  LookupState,
  NewPetFormState,
  PetMode,
  PhotoItem,
  SelectedSlot,
  Step,
} from './types';

/**
 * Toàn bộ trạng thái, truy vấn và thao tác của biểu mẫu đặt lịch bảy bước.
 *
 * Gom vào một hook để `BookingPage` chỉ còn việc lắp các bước lại với nhau, và để từng
 * bước là component thuần trình bày - nhận đúng những gì nó cần qua props, không tự đi
 * gọi API. Nhờ vậy chúng đọc được, và thay đổi giao diện một bước không đụng tới
 * trạng thái của sáu bước kia.
 *
 * Trạng thái bước vẫn nằm ở `useState` chứ không đẩy lên URL - prompt.md yêu cầu rõ:
 * không routing theo bước, không kho trạng thái ngoài.
 */
export function useBookingForm() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isOwner = user?.role === Role.PET_OWNER;
  const handoff = (location.state as BookingHandoffState | null) ?? {};

  const [step, setStep] = useState<Step>(1);

  // --- Bước 1-3: chi nhánh / dịch vụ / bác sĩ ---------------------------------------
  const [branchId, setBranchId] = useState(handoff.branchId ?? '');
  /** `null` = chưa chọn gì; `ANY_DOCTOR` = cố ý để phòng khám sắp xếp. */
  const [doctorId, setDoctorId] = useState<string | null>(handoff.doctorId ?? null);
  const [serviceId, setServiceId] = useState(handoff.serviceId ?? '');

  // --- Bước 4: ngày giờ -------------------------------------------------------------
  //
  // Mở ở tuần chứa NGÀY MAI chứ không phải hôm nay: sớm nhất đặt được là ngày mai, nên
  // nếu hôm nay là thứ Sáu thì cả tuần hiện tại đều đã khóa - khách mở bước chọn giờ ra
  // và thấy một bảng trống trơn không bấm được gì.
  //
  // Riêng "tuần chứa ngày mai" vẫn chưa đủ: tuần bắt đầu từ thứ Hai, nên khi hôm nay là
  // thứ Bảy thì ngày mai (Chủ nhật) là ngày CUỐI của tuần đó và mọi ngày còn lại đều đã
  // qua. `autoAdvanced` ở dưới xử lý nốt trường hợp đó bằng chính dữ liệu trả về.
  const [weekOf, setWeekOf] = useState(() =>
    format(startOfDay(new Date(Date.now() + 24 * 60 * 60 * 1000)), 'yyyy-MM-dd'),
  );
  const [autoAdvanced, setAutoAdvanced] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  // --- Bước 5: chủ nuôi + thú cưng --------------------------------------------------
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [email, setEmail] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [petMode, setPetMode] = useState<PetMode>('existing');
  const [petId, setPetId] = useState(handoff.petId ?? '');
  const [newPet, setNewPet] = useState<NewPetFormState>(EMPTY_NEW_PET);
  /** Tên đã lấy được từ hệ thống thì khoá lại, có nút "Sửa" nếu khách muốn đổi. */
  const [nameLocked, setNameLocked] = useState(true);

  // --- Bước 6: triệu chứng ----------------------------------------------------------
  const [commonSymptoms, setCommonSymptoms] = useState<CommonSymptom[]>([]);
  const [otherSymptoms, setOtherSymptoms] = useState('');
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);

  // --- Bước 7: gửi ------------------------------------------------------------------
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<Appointment | null>(null);

  // --- Truy vấn ---------------------------------------------------------------------
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
    queryFn: () => appointmentsApi.publicCalendar(branchId, doctorId || undefined, weekOf),
    enabled: !!branchId && doctorId !== null,
  });

  const { data: myPets } = useQuery({
    queryKey: ['pets', 'mine'],
    queryFn: petsApi.mine,
    enabled: isOwner,
  });

  /**
   * Đã đăng nhập thì phần thông tin chủ nuôi tự điền - JWT chỉ mang số điện thoại nên
   * họ tên phải lấy từ hồ sơ.
   */
  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.me,
    enabled: isOwner,
  });

  const { data: speciesList } = useQuery({ queryKey: ['species'], queryFn: speciesApi.list });
  const { data: breeds } = useQuery({
    queryKey: ['breeds', newPet.speciesId],
    queryFn: () => speciesApi.breedsFor(newPet.speciesId),
    enabled: !!newPet.speciesId,
  });

  useEffect(() => {
    if (!me) return;
    setOwnerFullName((prev) => prev || me.fullName);
    setEmail((prev) => prev || me.email || '');
    setLookupState('found');
  }, [me]);

  /**
   * Tra cứu theo số điện thoại cho KHÁCH CHƯA ĐĂNG NHẬP: đã có hồ sơ thì lấy tên lên
   * và tự điền, chưa có thì mới để khách tự nhập. Người đã đăng nhập bỏ qua - hồ sơ
   * của chính họ đã được `me` điền rồi.
   */
  const debouncedPhone = useDebouncedValue(phone.trim(), 500);
  useEffect(() => {
    if (isOwner) return;
    // Số Việt Nam ngắn nhất là 10 chữ số - gọi sớm hơn chỉ tốn request và chắc chắn 400.
    if (debouncedPhone.replace(/\D/g, '').length < 10) {
      setLookupState('idle');
      return;
    }

    let cancelled = false;
    setLookupState('loading');
    appointmentsApi
      .ownerLookup(debouncedPhone)
      .then((result) => {
        if (cancelled) return;
        if (result.found && result.fullName) {
          setOwnerFullName(result.fullName);
          setLookupState('found');
        } else {
          setLookupState('new');
        }
      })
      .catch(() => {
        // Tra cứu hỏng thì quay về nhập tay - không được chặn đường đặt lịch.
        if (!cancelled) setLookupState('new');
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedPhone, isOwner]);

  /**
   * Tuần mở đầu có thể không còn ô nào đặt được - hay gặp nhất khi hôm nay là thứ Bảy:
   * ngày mai là Chủ nhật, tức ngày cuối tuần, nên bảng hiện ra toàn ô đã qua hoặc đóng
   * cửa. Nhảy sang tuần sau ĐÚNG MỘT LẦN, dựa trên dữ liệu thật chứ không đoán theo thứ
   * trong tuần (một tuần kín lịch cũng rơi vào đúng tình cảnh này).
   *
   * Chỉ chạy khi khách chưa tự bấm chuyển tuần - `goToWeek` đặt `autoAdvanced` để lần
   * điều hướng thủ công không bị kéo đi tiếp.
   */
  useEffect(() => {
    if (autoAdvanced || !calendarDays || calendarDays.length === 0) return;
    const hasFreeSlot = calendarDays.some((day) =>
      day.slots.some((slot) => slot.status === SlotStatus.FREE),
    );
    if (hasFreeSlot) return;

    setAutoAdvanced(true);
    setWeekOf(format(addWeeks(parseISO(weekOf), 1), 'yyyy-MM-dd'));
  }, [autoAdvanced, calendarDays, weekOf]);

  // --- Giá trị dẫn xuất --------------------------------------------------------------
  const selectedBranch = branches?.find((b) => b.id === branchId);
  const selectedDoctor = doctors?.find((d) => d.id === doctorId);
  const selectedService = services.find((s) => s.id === serviceId);
  const hasExistingPets = isOwner && (myPets?.length ?? 0) > 0;
  const effectivePetMode: PetMode = hasExistingPets ? petMode : 'new';
  const selectedExistingPet = myPets?.find((p) => p.id === petId);
  const nameIsReadOnly = lookupState === 'found' && nameLocked;
  const serviceDuration = selectedService?.durationMinutes ?? 30;

  /**
   * Sớm nhất đặt được là 00:00 NGÀY MAI - cùng luật với `earliestSelfBookableStart()`
   * phía backend. Tính ở đây để tuần hiện tại không mở được nút "Tuần trước" và để nhãn
   * ngày tự làm mờ.
   */
  const earliestBookable = startOfDay(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const canGoPrevWeek = subWeeks(parseISO(weekOf), 1) >= startOfDay(new Date());

  const canProceed = (() => {
    switch (step) {
      case 1:
        return !!branchId;
      case 2:
        return !!serviceId;
      case 3:
        return doctorId !== null;
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

  // --- Thao tác ----------------------------------------------------------------------
  function selectBranch(id: string) {
    setBranchId(id);
    setDoctorId(null);
    setSelectedSlot(null);
  }

  function selectDoctor(id: string | null) {
    setDoctorId(id);
    setSelectedSlot(null);
  }

  function selectService(id: string) {
    setServiceId(id);
    // Đổi dịch vụ là đổi thời lượng - khung giờ đã chọn có thể không còn đủ chỗ, nên
    // bỏ chọn để khách chọn lại trên lưới mới.
    setSelectedSlot(null);
  }

  function updateNewPet(patch: Partial<NewPetFormState>) {
    setNewPet((prev) => ({ ...prev, ...patch }));
  }

  function changePhone(value: string) {
    setPhone(value);
    setNameLocked(true);
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
          setPhotoItems((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: 'done', url: res.url } : p)),
          );
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
    // Khách đã tự chọn tuần thì thôi tự nhảy - xem `autoAdvanced` ở trên.
    setAutoAdvanced(true);
    setWeekOf(format(next, 'yyyy-MM-dd'));
  }

  const bookingMutation = useMutation({
    mutationFn: (payload: CreateBookingPayload) => appointmentsApi.createPublicBooking(payload),
  });

  function submit() {
    if (!selectedSlot || !branchId || doctorId === null || !serviceId) return;
    setSubmitError(null);

    const payload: CreateBookingPayload = {
      phone: phone.trim(),
      ownerFullName: ownerFullName.trim(),
      email: email.trim() || undefined,
      branchId,
      // Chuỗi rỗng = "để phòng khám sắp xếp" - gửi `undefined` để backend tự chọn.
      doctorId: doctorId || undefined,
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
        speciesId: newPet.speciesId || undefined,
        breedId: newPet.breedId,
        gender: newPet.gender,
        weight: newPet.weight ? Number(newPet.weight) : undefined,
        birthDate: newPet.birthDate || undefined,
      };
    }

    bookingMutation.mutate(payload, {
      onSuccess: setBookingResult,
      onError: (error) => {
        setSubmitError(getErrorMessage(error, 'Đặt lịch thất bại. Vui lòng thử lại.'));
        if (isConflictError(error)) {
          // Khung giờ vừa bị người khác chiếm - kéo khách về bước chọn giờ với lưới mới.
          void queryClient.invalidateQueries({ queryKey: calendarQueryKey });
          setSelectedSlot(null);
          setStep(4);
        }
      },
    });
  }

  return {
    user,
    step,
    setStep,
    canProceed,

    branch: { id: branchId, list: branches, isLoading: branchesLoading, selected: selectedBranch, select: selectBranch },
    service: {
      id: serviceId,
      list: services,
      isLoading: servicesLoading,
      selected: selectedService,
      select: selectService,
      duration: serviceDuration,
    },
    doctor: { id: doctorId, list: doctors, isLoading: doctorsLoading, selected: selectedDoctor, select: selectDoctor },
    schedule: {
      days: calendarDays,
      isLoading: calendarLoading,
      isError: calendarError,
      selectedSlot,
      setSelectedSlot,
      goToWeek,
      canGoPrevWeek,
      earliestBookable,
    },
    owner: {
      phone,
      changePhone,
      fullName: ownerFullName,
      setFullName: setOwnerFullName,
      email,
      setEmail,
      lookupState,
      nameIsReadOnly,
      unlockName: () => setNameLocked(false),
      isLoggedIn: isOwner,
    },
    pet: {
      mode: effectivePetMode,
      setMode: setPetMode,
      hasExisting: hasExistingPets,
      myPets,
      id: petId,
      setId: setPetId,
      selectedExisting: selectedExistingPet,
      newPet,
      updateNewPet,
      speciesList,
      breeds,
    },
    symptoms: {
      common: commonSymptoms,
      toggle: toggleSymptom,
      other: otherSymptoms,
      setOther: setOtherSymptoms,
      photos: photoItems,
      onFilesSelected,
      removePhoto,
    },
    result: { booking: bookingResult, submitError, submit, isSubmitting: bookingMutation.isPending },
  };
}

export type BookingForm = ReturnType<typeof useBookingForm>;
