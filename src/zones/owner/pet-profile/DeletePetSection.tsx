import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { petsApi } from '@/api/pets.api';
import { Alert, Button, ConfirmDialog } from '@/components/basic';
import { getErrorMessage } from '@/utils/errors';

/** Chủ nuôi xoá hồ sơ tạo nhầm. Bé đã có lịch sử khám thì API từ chối và nói lý do. */
export function DeletePetSection({ petId, petName }: { petId: string; petName: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => petsApi.removeMine(petId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pets', 'mine'] });
      navigate('/my/pets', { replace: true });
    },
  });

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold text-foreground">Xoá hồ sơ thú cưng</h2>
      <p className="mt-1 text-sm text-muted">
        Dùng khi bạn tạo nhầm hồ sơ. Hồ sơ đã có lịch hẹn hoặc hồ sơ khám được phòng khám lưu giữ và
        không xoá được.
      </p>
      {mutation.isError && (
        <Alert tone="danger" className="mt-3">
          {getErrorMessage(mutation.error, 'Chưa xoá được hồ sơ, vui lòng thử lại.')}
        </Alert>
      )}
      <Button variant="destructive" size="sm" className="mt-4" onClick={() => setOpen(true)}>
        Xoá hồ sơ
      </Button>
      <ConfirmDialog
        open={open}
        destructive
        title="Xoá hồ sơ thú cưng?"
        description={`Hồ sơ của ${petName} sẽ bị xoá khỏi tài khoản của bạn.`}
        confirmLabel="Xoá hồ sơ"
        loading={mutation.isPending}
        onCancel={() => setOpen(false)}
        onConfirm={() => mutation.mutate(undefined, { onSettled: () => setOpen(false) })}
      />
    </section>
  );
}
