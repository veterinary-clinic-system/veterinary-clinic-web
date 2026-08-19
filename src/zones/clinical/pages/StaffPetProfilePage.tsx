import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { Badge } from '@/components/basic';
import { AppointmentsTab } from '../pet-profile/tabs/AppointmentsTab';
import { BasicInfoTab } from '../pet-profile/tabs/BasicInfoTab';
import { InvoicesTab } from '../pet-profile/tabs/InvoicesTab';
import { LaboratoryTab } from '../pet-profile/tabs/LaboratoryTab';
import { MedicalHistoryTab } from '../pet-profile/tabs/MedicalHistoryTab';
import { OwnerTab } from '../pet-profile/tabs/OwnerTab';
import { PrescriptionsTab } from '../pet-profile/tabs/PrescriptionsTab';
import { VaccinationTab } from '../pet-profile/tabs/VaccinationTab';

/**
 * Hồ sơ thú cưng nhìn từ phía nhân viên - tám khối theo FR-04-03 / mục 12.4 SRS:
 * Basic Info → Owner → Medical History → Appointment → Vaccination → Prescription →
 * Laboratory → Invoice.
 *
 * Từ Phase 9, hai tab "Tiêm chủng" và "Xét nghiệm" có dữ liệu thật: sổ tiêm chủng kèm
 * lịch nhắc (FR-12) và bảng chỉ số xét nghiệm theo thời gian (FR-13-02). Trước đó chúng
 * là hai khối rỗng dựng sẵn đúng vị trí — nay chỉ việc đổ dữ liệu vào.
 *
 * Mỗi khối là một tab component độc lập trong `../pet-profile/tabs/` - tự có truy vấn
 * riêng. Trang này chỉ còn header, cảnh báo y tế, tab bar và lắp ráp.
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
      {tab === 'vaccination' && <VaccinationTab petId={id} />}
      {tab === 'prescriptions' && <PrescriptionsTab petId={id} />}
      {tab === 'laboratory' && <LaboratoryTab petId={id} />}
      {tab === 'invoices' && <InvoicesTab petId={id} />}
    </div>
  );
}
