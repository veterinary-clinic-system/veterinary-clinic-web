import { ChangeEvent, FormEvent, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/catalog.api';
import { doctorsApi } from '@/api/doctors.api';
import { filesApi } from '@/api/files.api';
import { petsApi, speciesApi } from '@/api/pets.api';
import { queueApi, WalkInPayload } from '@/api/queue.api';
import { Button, CheckboxGroup, Input, Modal, Select, Textarea, useToast } from '@/components/basic';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { CommonSymptom, COMMON_SYMPTOM_LABEL_VI, Gender, PriorityColor, PRIORITY_COLOR_LABEL_VI } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { GENDER_LABEL_VI } from '@/utils/display';
import { formatTime } from '@/utils/format';

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

export function WalkInModal({
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
