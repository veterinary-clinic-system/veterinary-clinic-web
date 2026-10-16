import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { messagingApi, messagingKeys } from '@/api/messaging.api';
import { Button, EmptyState, Icon, cn } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { NewConversationDialog } from './NewConversationDialog';

interface MessagingWorkspaceProps {
  /** Đường dẫn của trang tin nhắn trong zone, vd. /my/messages hoặc /staff/messages. */
  basePath: string;
  viewer: 'owner' | 'doctor';
  className?: string;
}

/**
 * Khung tin nhắn hai cột dùng chung cho chủ nuôi và bác sĩ. Màn hình hẹp chỉ hiện một cột:
 * danh sách khi chưa chọn, luồng tin khi URL có :conversationId.
 */
export function MessagingWorkspace({ basePath, viewer, className }: MessagingWorkspaceProps) {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const conversations = useQuery({
    queryKey: messagingKeys.conversations(),
    queryFn: messagingApi.conversations,
  });

  const active = conversations.data?.find((item) => item.id === conversationId);

  return (
    <div
      className={cn(
        'grid h-[calc(100vh-12rem)] min-h-[28rem] overflow-hidden rounded-xl border border-border bg-surface lg:grid-cols-[20rem_1fr]',
        className,
      )}
    >
      <aside
        aria-label="Danh sách cuộc trò chuyện"
        className={cn(
          'flex min-h-0 flex-col border-border lg:border-r',
          conversationId && 'hidden lg:flex',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="font-semibold text-foreground">Cuộc trò chuyện</h2>
          <Button size="sm" variant="secondary" onClick={() => setDialogOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Mới
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations.data}
            isLoading={conversations.isLoading}
            error={conversations.isError ? conversations.error : null}
            onRetry={() => void conversations.refetch()}
            activeId={conversationId}
            basePath={basePath}
            viewer={viewer}
            onNew={() => setDialogOpen(true)}
          />
        </div>
      </aside>

      <div className={cn('min-h-0', !conversationId && 'hidden lg:block')}>
        {active && user ? (
          <MessageThread
            key={active.id}
            conversation={active}
            myUserId={user.sub}
            viewer={viewer}
            basePath={basePath}
          />
        ) : conversationId && conversations.isSuccess ? (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState
              icon="🔍"
              title="Không tìm thấy cuộc trò chuyện"
              description="Cuộc trò chuyện này không tồn tại hoặc không thuộc về tài khoản của bạn."
              action={
                <Button variant="secondary" onClick={() => navigate(basePath)}>
                  Về danh sách
                </Button>
              }
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <span aria-hidden="true" className="text-3xl opacity-60">
              💬
            </span>
            <p className="mt-2 font-medium text-foreground">Chọn một cuộc trò chuyện</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              {viewer === 'owner'
                ? 'Nhắn tin hoặc gọi thoại/video với bác sĩ đã khám cho bé.'
                : 'Nhắn tin hoặc gọi thoại/video với chủ của các bé bạn đã khám.'}
            </p>
          </div>
        )}
      </div>

      <NewConversationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        viewer={viewer}
        onOpened={(id) => navigate(`${basePath}/${id}`)}
      />
    </div>
  );
}
