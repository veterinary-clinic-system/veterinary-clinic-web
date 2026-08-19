import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments.api';
import { branchesApi } from '@/api/branches.api';
import { doctorsApi } from '@/api/doctors.api';
import {
  Badge,
  Button,
  DataColumn,
  DataTable,
  Icon,
  PageHeader,
  Select,
  TriageBadge,
} from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { AppointmentStatus } from '@/types/enums';
import { Appointment } from '@/types/models';
import { APPOINTMENT_STATUS_TONE } from '@/utils/appointment-status';
import { formatDate, formatTime } from '@/utils/format';
import { APPOINTMENT_STATUS_LABEL_VI } from '@/utils/labels';
import { MarkNoShowDialog } from '../appointments/MarkNoShowDialog';

const LIMIT = 20;

/** Chỉ lịch CHƯA tiếp nhận mới đánh vắng được - backend chặn các trạng thái còn lại. */
function canMarkNoShow(appointment: Appointment): boolean {
  return (
    appointment.status === AppointmentStatus.PENDING ||
    appointment.status === AppointmentStatus.CONFIRMED
  );
}

/**
 * Danh sách lịch hẹn của lễ tân và bác sĩ.
 *
 * Dùng `DataTable` thay cho bảng viết tay: bảng cũ không có sắp xếp, không có trạng
 * thái tải/rỗng đúng chuẩn, và pager của nó là bản chép tay thứ tư trong dự án.
 *
 * **Bấm vào hàng là mở chi tiết**, không phải chỉ bấm vào tên thú cưng. Ở nhịp làm việc
 * của quầy lễ tân, buộc trúng một liên kết rộng 60px là chỗ mất thời gian thật - trong
 * khi cả hàng cao 36px và rộng cả màn hình.
 *
 * Cột "SĐT chủ nuôi" giữ lại dù dài: đó là thứ lễ tân gọi khi khách trễ giờ, và bắt họ
 * mở chi tiết để lấy số là thêm hai lần điều hướng cho một việc làm hàng chục lần mỗi
 * ngày.
 */
export function AppointmentsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState(user?.branchId ?? '');
  const [doctorId, setDoctorId] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const [noShowTarget, setNoShowTarget] = useState<Appointment | null>(null);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const doctorsQuery = useQuery({
    queryKey: ['doctors-public', branchId],
    queryFn: () => doctorsApi.listPublic(branchId || undefined),
  });

  const listQuery = useQuery({
    queryKey: ['appointments-list', branchId, doctorId, status, page],
    queryFn: () =>
      appointmentsApi.list({
        page,
        limit: LIMIT,
        branchId: branchId || undefined,
        doctorId: doctorId || undefined,
        status: status || undefined,
      }),
    // Giữ trang cũ trong lúc tải trang mới - bảng không nháy trắng giữa hai lần lật.
    placeholderData: (prev) => prev,
  });

  const columns: DataColumn<Appointment>[] = [
    {
      key: 'startAt',
      header: 'Thời gian',
      width: '9rem',
      render: (appointment) => (
        <span className="tabular-nums">
          <span className="font-medium text-foreground">{formatTime(appointment.startAt)}</span>{' '}
          <span className="text-muted">{formatDate(appointment.startAt)}</span>
        </span>
      ),
    },
    {
      key: 'pet',
      header: 'Thú cưng',
      render: (appointment) => (
        <span>
          <span className="block font-medium text-foreground">
            {appointment.pet?.name ?? 'Chưa có hồ sơ'}
          </span>
          <span className="block text-xs text-muted">{appointment.pet?.breed?.breedName}</span>
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'SĐT chủ nuôi',
      hideBelow: 'md',
      render: (appointment) =>
        appointment.pet?.owner?.phone ? (
          <a
            href={`tel:${appointment.pet.owner.phone.replace(/\s/g, '')}`}
            onClick={(event) => event.stopPropagation()}
            className="text-primary hover:underline"
          >
            {appointment.pet.owner.phone}
          </a>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'doctor',
      header: 'Bác sĩ',
      hideBelow: 'lg',
      render: (appointment) => appointment.doctor?.fullName ?? <span className="text-muted">Chưa gán</span>,
    },
    {
      key: 'service',
      header: 'Dịch vụ',
      hideBelow: 'lg',
      render: (appointment) => appointment.service?.item.itemName ?? '—',
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (appointment) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge variant={APPOINTMENT_STATUS_TONE[appointment.status] ?? 'neutral'}>
            {APPOINTMENT_STATUS_LABEL_VI[appointment.status]}
          </Badge>
          {appointment.priorityColor && <TriageBadge color={appointment.priorityColor} />}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        title="Lịch hẹn"
        description="Toàn bộ lịch hẹn của phòng khám, lọc theo chi nhánh, bác sĩ và trạng thái."
        actions={
          <Link to="/staff/calendar">
            <Button variant="secondary">
              <Icon name="calendar" className="h-4 w-4" />
              Xem dạng lịch
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={listQuery.data?.data ?? []}
        getRowId={(appointment) => appointment.id}
        loading={listQuery.isLoading}
        error={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        page={listQuery.data?.page}
        limit={listQuery.data?.limit}
        total={listQuery.data?.total}
        onPageChange={setPage}
        onRowClick={(appointment) => navigate(`/staff/appointments/${appointment.id}`)}
        emptyTitle="Không có lịch hẹn nào khớp bộ lọc"
        emptyDescription="Thử bỏ bớt điều kiện lọc, hoặc chuyển sang chế độ lịch để xem cả tuần."
        toolbar={
          <>
            <Select
              label="Chi nhánh"
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setDoctorId('');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tất cả chi nhánh' },
                ...(branchesQuery.data ?? []).map((branch) => ({
                  value: branch.id,
                  label: branch.branchName,
                })),
              ]}
            />
            <Select
              label="Bác sĩ"
              value={doctorId}
              onChange={(value) => {
                setDoctorId(value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tất cả bác sĩ' },
                ...(doctorsQuery.data ?? []).map((doctor) => ({
                  value: doctor.id,
                  label: doctor.fullName,
                })),
              ]}
            />
            <Select
              label="Trạng thái"
              value={status}
              onChange={(value) => {
                setStatus(value as AppointmentStatus | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                ...Object.values(AppointmentStatus).map((value) => ({
                  value,
                  label: APPOINTMENT_STATUS_LABEL_VI[value],
                })),
              ]}
            />
          </>
        }
        rowActions={(appointment) =>
          canMarkNoShow(appointment) ? (
            <Button variant="ghost" size="sm" onClick={() => setNoShowTarget(appointment)}>
              Không đến
            </Button>
          ) : null
        }
      />

      <MarkNoShowDialog appointment={noShowTarget} onClose={() => setNoShowTarget(null)} />
    </div>
  );
}
