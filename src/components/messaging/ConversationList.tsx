import { Link } from 'react-router-dom';
import { Conversation } from '@/api/messaging.api';
import { Avatar, Button, EmptyState, Skeleton, cn } from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { formatListTime } from './messaging-format';

interface ConversationListProps {
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  activeId: string | undefined;
  basePath: string;
  viewer: 'owner' | 'doctor';
  onNew: () => void;
}

export function ConversationList({
  conversations,
  isLoading,
  error,
  onRetry,
  activeId,
  basePath,
  viewer,
  onNew,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <ul aria-busy="true" aria-label="Đang tải cuộc trò chuyện" className="space-y-1 p-2">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <span className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-5/6" />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div className="p-3">
        <QueryErrorState error={error} title="Không tải được cuộc trò chuyện" onRetry={onRetry} />
      </div>
    );
  }

  if (!conversations?.length) {
    return (
      <div className="p-3">
        <EmptyState
          icon="💬"
          title="Chưa có cuộc trò chuyện nào"
          description={
            viewer === 'owner'
              ? 'Nhắn cho bác sĩ đã khám để hỏi thêm về tình trạng của bé.'
              : 'Nhắn cho chủ nuôi để dặn dò hoặc hỏi thăm sau buổi khám.'
          }
          action={<Button onClick={onNew}>Bắt đầu trò chuyện</Button>}
        />
      </div>
    );
  }

  return (
    <ul aria-label="Cuộc trò chuyện" className="p-2">
      {conversations.map((conversation) => {
        const active = conversation.id === activeId;
        const unread = conversation.unreadCount > 0;
        return (
          <li key={conversation.id}>
            <Link
              to={`${basePath}/${conversation.id}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-touch items-center gap-3 rounded-lg px-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                active ? 'bg-primary/10' : 'hover:bg-surface-muted',
              )}
            >
              <Avatar
                name={conversation.counterpart.fullName}
                src={conversation.counterpart.avatarUrl}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-sm text-foreground',
                      unread ? 'font-semibold' : 'font-medium',
                    )}
                  >
                    {conversation.counterpart.fullName}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {formatListTime(conversation.lastMessageAt ?? conversation.createdAt)}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={cn('truncate text-sm', unread ? 'text-foreground' : 'text-muted')}
                  >
                    {conversation.lastMessagePreview ?? 'Chưa có tin nhắn'}
                  </span>
                  {unread && (
                    <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground">
                      {conversation.unreadCount}
                      <span className="sr-only"> tin chưa đọc</span>
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
