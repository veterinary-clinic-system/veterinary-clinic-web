import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/api/pets.api';
import { ErrorState, Skeleton, SkeletonText, TabItem, Tabs } from '@/components/basic';
import { PatientHeader } from '../pet-profile/PatientHeader';
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
 * Basic Info -> Owner -> Medical History -> Appointment -> Vaccination -> Prescription
 * -> Laboratory -> Invoice.
 *
 * **Lịch sử khám là tab mặc định, không phải Thông tin cơ bản.** Bác sĩ mở hồ sơ để
 * xem lần trước đã chẩn đoán gì, không phải để đọc lại màu lông - và những thông tin
 * nhận dạng ấy giờ đã nằm sẵn trên thanh đầu trang, không cần một tab riêng để xem.
 *
 * Mỗi khối là một tab component độc lập trong `../pet-profile/tabs/` - tự có truy vấn
 * riêng. Trang này chỉ còn header, tab bar và lắp ráp.
 */
type Tab =
  | 'medical'
  | 'appointments'
  | 'vaccination'
  | 'prescriptions'
  | 'laboratory'
  | 'invoices'
  | 'basic'
  | 'owner';

const TABS: TabItem<Tab>[] = [
  { id: 'medical', label: 'Lịch sử khám' },
  { id: 'appointments', label: 'Lịch hẹn' },
  { id: 'vaccination', label: 'Tiêm chủng' },
  { id: 'prescriptions', label: 'Đơn thuốc' },
  { id: 'laboratory', label: 'Xét nghiệm' },
  { id: 'invoices', label: 'Hoá đơn' },
  { id: 'basic', label: 'Thông tin cơ bản' },
  { id: 'owner', label: 'Chủ nuôi' },
];

export function StaffPetProfilePage() {
  const { id = '' } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('medical');

  const petQuery = useQuery({
    queryKey: ['pet', id],
    queryFn: () => petsApi.getOne(id),
    enabled: Boolean(id),
  });

  if (petQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <SkeletonText lines={6} />
      </div>
    );
  }

  const pet = petQuery.data;
  if (!pet) {
    return (
      <ErrorState
        title="Không tìm thấy hồ sơ thú cưng"
        description="Hồ sơ có thể đã bị xoá, hoặc mã trong đường dẫn không đúng."
        onRetry={() => void petQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-stack">
      <PatientHeader pet={pet} />

      <Tabs items={TABS} value={tab} onChange={setTab} />

      <div>
        {tab === 'medical' && <MedicalHistoryTab petId={id} />}
        {tab === 'appointments' && <AppointmentsTab petId={id} />}
        {tab === 'vaccination' && <VaccinationTab petId={id} />}
        {tab === 'prescriptions' && <PrescriptionsTab petId={id} />}
        {tab === 'laboratory' && <LaboratoryTab petId={id} />}
        {tab === 'invoices' && <InvoicesTab petId={id} />}
        {tab === 'basic' && <BasicInfoTab pet={pet} />}
        {tab === 'owner' && <OwnerTab pet={pet} />}
      </div>
    </div>
  );
}
