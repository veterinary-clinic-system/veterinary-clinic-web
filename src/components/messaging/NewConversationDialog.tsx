import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessagingContact, messagingApi, messagingKeys } from '@/api/messaging.api';
import { Avatar, EmptyState, Modal, SkeletonText, useToast } from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  viewer: 'owner' | 'doctor';
  onOpened: (conversationId: string) => void;
}

/**
 * Chọn người để nhắn. Danh sách do máy chủ lọc sẵn: chủ nuôi chỉ thấy bác sĩ đã/đang khám cho
 * bé của mình, bác sĩ chỉ thấy chủ của các bé mình đã/đang khám.
 */
export function NewConversationDialog({
  open,
  onClose,
  viewer,
  onOpened,
}: NewConversationDialogProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const contacts = useQuery({
    queryKey: messagingKeys.contacts(),
    queryFn: messagingApi.contacts,
    enabled: open,
  });

  const openMutation = useMutation({
    mutationFn: (contact: MessagingContact) =>
      messagingApi.open(
        viewer === 'owner'
          ? { doctorId: contact.counterpart.id }
          : { ownerId: contact.counterpart.id },
      ),
    onMutate: (contact) => setPendingId(contact.counterpart.id),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
      void queryClient.invalidateQueries({ queryKey: messagingKeys.contacts() });
      onOpened(conversation.id);
      onClose();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
    onSettled: () => setPendingId(null),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={viewer === 'owner' ? 'Nhắn tin cho bác sĩ' : 'Nhắn tin cho chủ thú cưng'}
    >
      <p className="text-sm text-muted">
        {viewer === 'owner'
          ? 'Bạn có thể nhắn cho các bác sĩ đã hoặc đang khám cho bé nhà mình.'
          : 'Bạn có thể nhắn cho chủ của các bé bạn đã hoặc đang khám.'}
      </p>

      <div className="mt-4">
        {contacts.isLoading ? (
          <SkeletonText lines={4} />
        ) : contacts.isError ? (
          <QueryErrorState
            error={contacts.error}
            title="Không tải được danh sách"
            onRetry={() => void contacts.refetch()}
          />
        ) : !contacts.data?.length ? (
          <EmptyState
            icon="💬"
            title={
              viewer === 'owner' ? 'Chưa có bác sĩ nào khám cho bé' : 'Chưa có chủ thú cưng nào'
            }
            description={
              viewer === 'owner'
                ? 'Sau khi lịch hẹn được phòng khám xác nhận, bạn sẽ nhắn được với bác sĩ phụ trách.'
                : 'Các chủ nuôi có lịch hẹn đã xác nhận với bạn sẽ xuất hiện ở đây.'
            }
            action={
              viewer === 'owner' ? (
                <Link
                  to="/booking"
                  className="inline-flex min-h-touch items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Đặt lịch khám
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {contacts.data.map((contact) => (
              <li key={contact.counterpart.id}>
                <button
                  type="button"
                  disabled={openMutation.isPending}
                  onClick={() => openMutation.mutate(contact)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none disabled:opacity-60"
                >
                  <Avatar name={contact.counterpart.fullName} src={contact.counterpart.avatarUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {contact.counterpart.fullName}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      Bé {contact.petNames.join(', ')}
                      {contact.lastVisitAt &&
                        ` · lần khám gần nhất ${formatDate(contact.lastVisitAt)}`}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {pendingId === contact.counterpart.id
                      ? 'Đang mở…'
                      : contact.conversationId
                        ? 'Mở'
                        : 'Nhắn tin'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
