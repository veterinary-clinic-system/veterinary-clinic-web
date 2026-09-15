import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { usersApi } from '@/api/doctors.api';
import {
  Alert,
  Button,
  Checkbox,
  CheckboxGroup,
  Input,
  Modal,
  Select,
  useToast,
} from '@/components/basic';
import { Role, Specialization } from '@/types/enums';
import { StaffUser } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { ROLE_LABEL_VI, SPECIALIZATION_LABEL_VI } from '@/utils/labels';
import { ImageUpload } from '@/components/ImageUpload';

const CREATABLE_ROLES = [
  Role.ADMIN,
  Role.MANAGER,
  Role.DOCTOR,
  Role.RECEPTIONIST,
  Role.PHARMACIST,
  Role.STAFF,
];

interface FormState {
  avatarUrl: string;
  phone: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  branchId: string;
  yearOfStart: string;
  specialization: Specialization[];
  active: boolean;
}

const EMPTY_FORM: FormState = {
  avatarUrl: '/images/default-staff.svg',
  phone: '',
  fullName: '',
  email: '',
  password: '',
  role: Role.RECEPTIONIST,
  branchId: '',
  yearOfStart: '',
  specialization: [],
  active: true,
};

export interface StaffAccountModalProps {
  open: boolean;
  onClose: () => void;
  
  editing: StaffUser | null;
}

export function StaffAccountModal({ open, onClose, editing }: StaffAccountModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            ...EMPTY_FORM,
            phone: editing.phone,
            avatarUrl: editing.avatarUrl,
            fullName: editing.fullName,
            email: editing.email ?? '',
            role: editing.role,
            branchId: editing.branchId ?? '',
            active: editing.active,
          }
        : EMPTY_FORM,
    );
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: () => {
      if (editing) {
        
        return usersApi.update(editing.id, {
          active: form.active,
          avatarUrl: form.avatarUrl,
          branchId: form.branchId || null,
        });
      }
      return usersApi.create({
        phone: form.phone,
        fullName: form.fullName,
        avatarUrl: form.avatarUrl,
        email: form.email || undefined,
        password: form.password,
        role: form.role,
        branchId: form.role === Role.ADMIN ? undefined : form.branchId,
        yearOfStart: form.role === Role.DOCTOR ? Number(form.yearOfStart) || undefined : undefined,
        specialization: form.role === Role.DOCTOR ? form.specialization : undefined,
      });
    },
    onSuccess: () => {
      toast.show(editing ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản mới.', 'success');
      void queryClient.invalidateQueries({ queryKey: ['staff-users'] });
      onClose();
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  const branchOptions = [
    { value: '', label: '— Chưa gán chi nhánh —' },
    ...(branchesQuery.data ?? []).map((branch) => ({
      value: branch.id,
      label: branch.branchName,
    })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Sửa tài khoản · ${editing.fullName}` : 'Thêm tài khoản nhân viên'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" form="staff-account-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </Button>
        </>
      }
    >
      <form id="staff-account-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ImageUpload
          label={form.role === Role.DOCTOR ? 'Ảnh bác sĩ' : 'Ảnh nhân viên'}
          category={form.role === Role.DOCTOR ? 'doctor-avatars' : 'user-avatars'}
          value={form.avatarUrl}
          onChange={(avatarUrl) => setForm({ ...form, avatarUrl })}
          required
        />
        {editing ? (
          <p className="text-sm text-muted">
            {editing.phone} · {ROLE_LABEL_VI[editing.role]} · đổi được chi nhánh và trạng thái hoạt
            động.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Số điện thoại"
                type="tel"
                required
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
              <Input
                label="Họ và tên"
                required
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              />
              <Input
                label="Email"
                type="email"
                hint="Không bắt buộc"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              <Input
                label="Mật khẩu"
                type="password"
                required
                hint="Tối thiểu 8 ký tự, có chữ hoa và số"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </div>

            <Select
              label="Vai trò"
              value={form.role}
              onChange={(value) => setForm({ ...form, role: value as Role })}
              options={CREATABLE_ROLES.map((role) => ({ value: role, label: ROLE_LABEL_VI[role] }))}
            />
          </>
        )}

        {}
        {form.role !== Role.ADMIN && (
          <Select
            label="Chi nhánh"
            required={!editing}
            value={form.branchId}
            onChange={(value) => setForm({ ...form, branchId: value })}
            options={branchOptions}
          />
        )}

        {!editing && form.role === Role.DOCTOR && (
          <>
            <Input
              label="Năm bắt đầu hành nghề"
              type="number"
              value={form.yearOfStart}
              onChange={(event) => setForm({ ...form, yearOfStart: event.target.value })}
            />
            <CheckboxGroup
              label="Chuyên khoa"
              value={form.specialization}
              onChange={(value) => setForm({ ...form, specialization: value as Specialization[] })}
              options={Object.values(Specialization).map((spec) => ({
                value: spec,
                label: SPECIALIZATION_LABEL_VI[spec],
              }))}
            />
          </>
        )}

        {editing && (
          <Checkbox
            label="Tài khoản đang hoạt động"
            checked={form.active}
            onChange={(checked) => setForm({ ...form, active: checked })}
          />
        )}

        {mutation.isError && (
          <Alert tone="danger" title="Không lưu được tài khoản">
            {getErrorMessage(mutation.error)}
          </Alert>
        )}
      </form>
    </Modal>
  );
}
