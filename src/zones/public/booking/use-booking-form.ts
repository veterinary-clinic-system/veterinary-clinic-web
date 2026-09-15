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

export function useBookingForm() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isOwner = user?.role === Role.PET_OWNER;
  const handoff = (location.state as BookingHandoffState | null) ?? {};

  const [step, setStep] = useState<Step>(1);

  const [branchId, setBranchId] = useState(handoff.branchId ?? '');
  
  const [doctorId, setDoctorId] = useState<string | null>(handoff.doctorId ?? null);
  const [serviceId, setServiceId] = useState(handoff.serviceId ?? '');

  const [weekOf, setWeekOf] = useState(() =>
    format(startOfDay(new Date(Date.now() + 24 * 60 * 60 * 1000)), 'yyyy-MM-dd'),
  );
  const [autoAdvanced, setAutoAdvanced] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [email, setEmail] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [petMode, setPetMode] = useState<PetMode>('existing');
  const [petId, setPetId] = useState(handoff.petId ?? '');
  const [newPet, setNewPet] = useState<NewPetFormState>(EMPTY_NEW_PET);
  
  const [nameLocked, setNameLocked] = useState(true);

  const [commonSymptoms, setCommonSymptoms] = useState<CommonSymptom[]>([]);
  const [otherSymptoms, setOtherSymptoms] = useState('');
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);

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
    queryFn: () => appointmentsApi.publicCalendar(branchId, doctorId || undefined, weekOf),
    enabled: !!branchId && doctorId !== null,
  });

  const { data: myPets } = useQuery({
    queryKey: ['pets', 'mine'],
    queryFn: petsApi.mine,
    enabled: isOwner,
  });

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

  const debouncedPhone = useDebouncedValue(phone.trim(), 500);
  useEffect(() => {
    if (isOwner) return;
    
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
        
        if (!cancelled) setLookupState('new');
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedPhone, isOwner]);

  useEffect(() => {
    if (autoAdvanced || !calendarDays || calendarDays.length === 0) return;
    const hasFreeSlot = calendarDays.some((day) =>
      day.slots.some((slot) => slot.status === SlotStatus.FREE),
    );
    if (hasFreeSlot) return;

    setAutoAdvanced(true);
    setWeekOf(format(addWeeks(parseISO(weekOf), 1), 'yyyy-MM-dd'));
  }, [autoAdvanced, calendarDays, weekOf]);

  const selectedBranch = branches?.find((b) => b.id === branchId);
  const selectedDoctor = doctors?.find((d) => d.id === doctorId);
  const selectedService = services.find((s) => s.id === serviceId);
  const hasExistingPets = isOwner && (myPets?.length ?? 0) > 0;
  const effectivePetMode: PetMode = hasExistingPets ? petMode : 'new';
  const selectedExistingPet = myPets?.find((p) => p.id === petId);
  const nameIsReadOnly = lookupState === 'found' && nameLocked;
  const serviceDuration = selectedService?.durationMinutes ?? 30;

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
