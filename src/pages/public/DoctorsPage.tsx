import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi, DoctorPublic } from '@/api/doctors.api';
import { getInitial, specializationLabel } from '@/utils/display';

function DoctorAvatar({ doctor }: { doctor: DoctorPublic }) {
  const [failed, setFailed] = useState(false);

  if (doctor.avatarUrl && !failed) {
    return (
      <img
        src={doctor.avatarUrl}
        alt={doctor.fullName}
        onError={() => setFailed(true)}
        className="h-16 w-16 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
      {getInitial(doctor.fullName)}
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: DoctorPublic }) {
  return (
    <div className="flex gap-4 rounded border border-border bg-surface p-5">
      <DoctorAvatar doctor={doctor} />
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-foreground">{doctor.fullName}</h2>
        <p className="text-sm text-muted">{doctor.branch.branchName}</p>
        {doctor.yearOfStart && (
          <p className="mt-1 text-sm text-muted">Hành nghề từ năm {doctor.yearOfStart}</p>
        )}
        {doctor.specialization.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {doctor.specialization.map((spec) => (
              <span
                key={spec}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {specializationLabel(spec)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DoctorsPage() {
  const [branchId, setBranchId] = useState<string>('');

  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: branchesApi.list });
  const {
    data: doctors,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['doctors', 'public', branchId],
    queryFn: () => doctorsApi.listPublic(branchId || undefined),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Đội ngũ bác sĩ</h1>
          <p className="mt-1 text-muted">Các bác sĩ thú y đang công tác tại hệ thống phòng khám.</p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Lọc theo chi nhánh</span>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="">Tất cả chi nhánh</option>
            {branches?.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branchName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p className="mt-8 text-muted">Đang tải danh sách bác sĩ...</p>}
      {isError && <p className="mt-8 text-destructive">Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.</p>}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {doctors?.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </div>

      {doctors && doctors.length === 0 && (
        <p className="mt-8 text-muted">Không tìm thấy bác sĩ nào phù hợp.</p>
      )}
    </div>
  );
}
