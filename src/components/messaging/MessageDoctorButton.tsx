import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingApi, messagingKeys } from '@/api/messaging.api';
import { Button, Icon, useToast } from '@/components/basic';
import { getErrorMessage } from '@/utils/errors';

/** Mở (hoặc tạo) cuộc trò chuyện với bác sĩ của lịch hẹn rồi chuyển sang trang tin nhắn. */
export function MessageDoctorButton({ doctorId }: { doctorId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const open = useMutation({
    mutationFn: () => messagingApi.open({ doctorId }),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
      navigate(`/my/messages/${conversation.id}`);
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  return (
    <Button variant="secondary" loading={open.isPending} onClick={() => open.mutate()}>
      {!open.isPending && <Icon name="message" className="h-4 w-4" />}
      Nhắn tin cho bác sĩ
    </Button>
  );
}
