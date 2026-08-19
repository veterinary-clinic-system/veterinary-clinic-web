import { Pet } from '@/types/models';
import { formatDate } from '@/utils/format';
import { GENDER_LABEL_VI } from '@/utils/display';
import { Row } from '../shared';

/** Khối 1 - Basic Information. Mã thú cưng / microchip / màu lông thêm ở P2-T1, P2-T2. */
export function BasicInfoTab({ pet }: { pet: Pet }) {
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
