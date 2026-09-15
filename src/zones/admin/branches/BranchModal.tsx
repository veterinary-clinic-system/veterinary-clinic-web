import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { Alert, Button, Checkbox, Input, Modal, Textarea, useToast } from '@/components/basic';
import { Branch } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';

interface FormState {
  branchName: string;
  phone: string;
  address: string;
  description: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  branchName: '',
  phone: '',
  address: '',
  description: '',
  active: true,
};

const VN_PHONE = /^(0|\+84)\d{9,10}$/;

function normalizePhone(phone: string): string {
  return phone.replace(/[\s.-]/g, '');
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.branchName.trim().length < 2) {
    errors.branchName = 'Tên chi nhánh cần ít nhất 2 ký tự.';
  }
  if (!VN_PHONE.test(normalizePhone(form.phone.trim()))) {
    errors.phone = 'Số Việt Nam bắt đầu bằng 0 hoặc +84, ví dụ 028 3822 1111.';
  }
  if (form.address.trim().length < 5) {
    errors.address = 'Địa chỉ cần ít nhất 5 ký tự.';
  }
  return errors;
}

export interface BranchModalProps {
  open: boolean;
  onClose: () => void;
  
  editing: Branch | null;
}

export function BranchModal({ open, onClose, editing }: BranchModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      editing
        ? {
            branchName: editing.branchName,
            phone: editing.phone,
            address: editing.address,
            description: editing.description ?? '',
            active: editing.active,
          }
        : EMPTY_FORM,
    );
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        branchName: form.branchName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };
      if (editing) {
        return branchesApi.update(editing.id, {
          ...payload,
          
          description: form.description.trim() || null,
          active: form.active,
        });
      }
      return branchesApi.create({ ...payload, description: form.description.trim() || undefined });
    },
    onSuccess: () => {
      toast.show(editing ? 'Đã cập nhật chi nhánh.' : 'Đã thêm chi nhánh mới.', 'success');
      void queryClient.invalidateQueries({ queryKey: ['branches-admin'] });
      
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Sửa chi nhánh · ${editing.branchName}` : 'Thêm chi nhánh'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" form="branch-form" loading={mutation.isPending}>
            {editing ? 'Lưu thay đổi' : 'Thêm chi nhánh'}
          </Button>
        </>
      }
    >
      <form id="branch-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Tên chi nhánh"
          required
          value={form.branchName}
          error={errors.branchName}
          onChange={(event) => setForm({ ...form, branchName: event.target.value })}
        />

        <Input
          label="Số điện thoại"
          type="tel"
          required
          hint="Số khách gọi tới chi nhánh này - hiện trên trang chi nhánh công khai."
          value={form.phone}
          error={errors.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />

        <Input
          label="Địa chỉ"
          required
          value={form.address}
          error={errors.address}
          onChange={(event) => setForm({ ...form, address: event.target.value })}
        />

        <Textarea
          label="Mô tả"
          rows={3}
          hint="Không bắt buộc. Ví dụ: có phòng lưu bệnh, nhận thú lớn."
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />

        {}
        {editing && (
          <div className="flex flex-col gap-1">
            <Checkbox
              label="Chi nhánh đang hoạt động"
              checked={form.active}
              onChange={(checked) => setForm({ ...form, active: checked })}
            />
            <p className="text-xs text-muted">
              Bỏ chọn thì chi nhánh biến mất khỏi trang công khai và khách không đặt lịch tới đây
              được nữa.
            </p>
          </div>
        )}

        {mutation.isError && (
          <Alert tone="danger" title="Không lưu được chi nhánh">
            {getErrorMessage(mutation.error)}
          </Alert>
        )}
      </form>
    </Modal>
  );
}
