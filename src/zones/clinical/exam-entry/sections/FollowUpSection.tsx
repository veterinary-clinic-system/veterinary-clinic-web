import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { branchesApi } from '@/api/branches.api';
import { catalogApi } from '@/api/catalog.api';
import { doctorsApi } from '@/api/doctors.api';
import { Button, Select } from '@/components/basic';
import { Section } from '../Section';

/** Đặt lịch tái khám - chỉ hiện sau khi hồ sơ đã chốt, đúng thứ tự của UC-03. */
export function FollowUpSection({
  appointmentId,
  appt,
}: {
  appointmentId: string;
  appt: { doctorId: string; branchId: string; serviceId: string };
}) {
  const [branchId, setBranchId] = useState(appt.branchId);
  const [doctorId, setDoctorId] = useState(appt.doctorId);
  const [serviceId, setServiceId] = useState(appt.serviceId);
  const [startAt, setStartAt] = useState('');

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const doctorsQuery = useQuery({
    queryKey: ['doctors-public', branchId],
    queryFn: () => doctorsApi.listPublic(branchId),
  });
  const servicesQuery = useQuery({
    queryKey: ['services', 'for-followup'],
    queryFn: () => catalogApi.services({ limit: 100 }),
  });

  const followUpMutation = useMutation({
    mutationFn: () =>
      appointmentsApi.scheduleFollowUp(appointmentId, {
        doctorId,
        branchId,
        serviceId,
        startAt: new Date(startAt).toISOString(),
      }),
  });

  return (
    <Section title="Đặt lịch tái khám">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (startAt) followUpMutation.mutate();
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={setBranchId}
          options={(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName }))}
          error={branchesQuery.isError ? 'Không tải được danh sách chi nhánh.' : undefined}
        />
        <Select
          label="Bác sĩ"
          value={doctorId}
          onChange={setDoctorId}
          options={(doctorsQuery.data ?? []).map((d) => ({ value: d.id, label: d.fullName }))}
          error={doctorsQuery.isError ? 'Không tải được danh sách bác sĩ.' : undefined}
        />
        <Select
          label="Dịch vụ"
          value={serviceId}
          onChange={setServiceId}
          options={(servicesQuery.data?.data ?? []).map((s) => ({
            value: s.id,
            label: s.item.itemName,
          }))}
          error={servicesQuery.isError ? 'Không tải được danh mục dịch vụ.' : undefined}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Thời gian</span>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="h-10 rounded border border-border bg-surface px-3 text-sm"
          />
        </label>
        <Button type="submit" loading={followUpMutation.isPending} disabled={!startAt}>
          Đặt lịch tái khám
        </Button>
      </form>
      {followUpMutation.isSuccess && followUpMutation.data && (
        <p className="mt-2 text-sm text-success">
          Đã đặt lịch tái khám —{' '}
          <Link to={`/staff/appointments/${followUpMutation.data.id}`} className="underline">
            xem lịch hẹn mới
          </Link>
        </p>
      )}
      {followUpMutation.isError && (
        <p className="mt-2 text-sm text-destructive">Đặt lịch tái khám thất bại.</p>
      )}
    </Section>
  );
}
