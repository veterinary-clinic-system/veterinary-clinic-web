import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { petsApi } from '@/api/pets.api';
import {
  DescriptionList,
  Icon,
  Skeleton,
  SkeletonText,
  TabItem,
  Tabs,
} from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { GENDER_LABEL_VI } from '@/utils/display';
import { formatDate } from '@/utils/format';
import { AppointmentList } from '../components/AppointmentList';
import { petAgeLabel } from '../components/pet-display';
import { DocumentsTab } from '../pet-profile/DocumentsTab';
import { MedicalHistoryTab } from '../pet-profile/MedicalHistoryTab';
import { PetHeader } from '../pet-profile/PetHeader';

type TabId = 'overview' | 'history' | 'appointments' | 'documents';

export function PetProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabId>('overview');

  const {
    data: pet,
    isLoading: petLoading,
    isError: petError,
    refetch,
  } = useQuery({
    queryKey: ['pets', id],
    queryFn: () => petsApi.getOne(id as string),
    enabled: !!id,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['pets', id, 'timeline'],
    queryFn: () => petsApi.timeline(id as string),
    enabled: !!id,
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments', 'mine'],
    queryFn: appointmentsApi.mine,
  });

  const petAppointments = (appointments ?? []).filter((appointment) => appointment.petId === id);

  if (petLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="h-40 w-full rounded-xl" />
        <SkeletonText lines={5} className="mt-6" />
      </div>
    );
  }

  if (petError || !pet) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <QueryErrorState
          error={petError}
          title="Không tải được hồ sơ thú cưng"
          description="Hồ sơ có thể đã bị xoá, hoặc không thuộc về tài khoản của bạn."
          onRetry={() => void refetch()}
        />
        <Link to="/my/pets" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
          <Icon name="chevron-left" className="h-4 w-4" />
          Quay lại danh sách thú cưng
        </Link>
      </div>
    );
  }

  const tabs: TabItem<TabId>[] = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'history', label: 'Lịch sử khám', count: timeline?.length },
    { id: 'appointments', label: 'Lịch hẹn', count: petAppointments.length },
    { id: 'documents', label: 'Tài liệu' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/my/pets"
        className="inline-flex min-h-touch items-center gap-1 text-sm text-primary hover:underline"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Thú cưng của tôi
      </Link>

      <div className="mt-3">
        <PetHeader pet={pet} />
      </div>

      <Tabs items={tabs} value={tab} onChange={setTab} className="mt-8" />

      <div className="mt-6">
        {tab === 'overview' && (
          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">Thông tin chung</h2>
            <DescriptionList
              className="mt-4"
              items={[
                { label: 'Giống', value: pet.breed?.breedName },
                { label: 'Loài', value: pet.breed?.species?.speciesName },
                { label: 'Giới tính', value: GENDER_LABEL_VI[pet.gender] },
                { label: 'Cân nặng', value: pet.weight != null ? `${pet.weight} kg` : null },
                {
                  label: 'Ngày sinh',
                  value: pet.birthDate
                    ? `${formatDate(pet.birthDate)} (${petAgeLabel(pet.birthDate)})`
                    : null,
                },
                { label: 'Màu lông', value: pet.color },
                { label: 'Mã chip', value: pet.microchipId },
                { label: 'Dị ứng', value: pet.allergies.join(', ') },
                { label: 'Bệnh mãn tính', value: pet.chronicConditions.join(', ') },
                { label: 'Ghi chú của bác sĩ', value: pet.notes, wide: true },
              ]}
            />
          </div>
        )}

        {tab === 'history' && (
          <MedicalHistoryTab entries={timeline} isLoading={timelineLoading} />
        )}

        {tab === 'appointments' && (
          <AppointmentList
            appointments={petAppointments}
            isLoading={appointmentsLoading}
            emptyTitle={`${pet.name} chưa có lịch hẹn nào`}
            emptyDescription="Đặt lịch khám để hệ thống theo dõi sức khoẻ của bé theo thời gian."
          />
        )}

        {tab === 'documents' && <DocumentsTab entries={timeline} isLoading={timelineLoading} />}
      </div>
    </div>
  );
}
