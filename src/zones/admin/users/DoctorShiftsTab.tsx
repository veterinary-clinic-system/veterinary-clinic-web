import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '@/api/doctors.api';
import { EmptyState, ErrorState, Select, Skeleton } from '@/components/basic';
import { BreaksPanel } from './BreaksPanel';
import { ShiftsPanel } from './ShiftsPanel';

/**
 * Lịch làm việc của bác sĩ: ca lặp theo tuần bên trái, nghỉ ngoài lịch bên phải.
 *
 * Chưa chọn bác sĩ thì hiện một trạng thái rỗng có hướng dẫn, không phải một khoảng
 * trắng - người mới vào trang này cần biết là còn thiếu một bước, chứ không phải đoán
 * xem trang có hỏng không.
 */
export function DoctorShiftsTab() {
  const [doctorId, setDoctorId] = useState('');

  const doctorsQuery = useQuery({
    queryKey: ['doctors-public', 'all'],
    queryFn: () => doctorsApi.listPublic(),
  });

  if (doctorsQuery.isLoading) {
    return <Skeleton className="h-11 w-full max-w-sm" />;
  }

  if (doctorsQuery.isError) {
    return (
      <ErrorState
        title="Không tải được danh sách bác sĩ"
        onRetry={() => void doctorsQuery.refetch()}
      />
    );
  }

  const doctors = doctorsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-stack">
      <Select
        label="Bác sĩ"
        value={doctorId}
        onChange={setDoctorId}
        className="max-w-sm"
        options={[
          { value: '', label: '— Chọn bác sĩ —' },
          ...doctors.map((doctor) => ({
            value: doctor.id,
            label: `${doctor.fullName} · ${doctor.branch.branchName}`,
          })),
        ]}
      />

      {doctorId ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ShiftsPanel doctorId={doctorId} />
          <BreaksPanel doctorId={doctorId} />
        </div>
      ) : (
        <EmptyState
          icon="🗓️"
          title="Chọn một bác sĩ để xem lịch làm việc"
          description="Ca làm việc quyết định khung giờ khách đặt được ở trang đặt lịch, nên mỗi bác sĩ cần ít nhất một ca."
        />
      )}
    </div>
  );
}
