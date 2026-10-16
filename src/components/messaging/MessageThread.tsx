import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '@/api/files.api';
import {
  ChatMessage,
  Conversation,
  MESSAGING_PAGE_SIZE,
  messagingApi,
  messagingKeys,
} from '@/api/messaging.api';
import { Avatar, Button, Icon, Skeleton, cn, useToast } from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { useCall } from '@/components/calls/call-context';
import { getErrorMessage } from '@/utils/errors';
import { appendMessageToCache } from './messaging-shared';
import { formatDayDivider, formatMessageTime } from './messaging-format';

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

interface MessageThreadProps {
  conversation: Conversation;
  myUserId: string;
  viewer: 'owner' | 'doctor';
  basePath: string;
}

function dayKey(value: string): string {
  return new Date(value).toDateString();
}

function CallLogRow({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const call = message.call;
  const missed = call && ['MISSED', 'REJECTED', 'CANCELLED'].includes(call.status);
  return (
    <div className="flex justify-center py-1">
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
          missed && !mine
            ? 'border-danger/30 bg-danger-soft text-danger'
            : 'border-border bg-surface text-muted',
        )}
      >
        <Icon name={call?.media === 'VIDEO' ? 'video' : 'phone'} className="h-3.5 w-3.5" />
        {message.body}
        <span className="text-muted">· {formatMessageTime(message.createdAt)}</span>
      </span>
    </div>
  );
}

export function MessageThread({ conversation, myUserId, viewer, basePath }: MessageThreadProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const call = useCall();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const keepOffsetRef = useRef<number | null>(null);
  // Người dùng đang ở cuối luồng thì giữ ở cuối khi có tin mới/ảnh tải xong; đang đọc tin cũ thì để yên.
  const stickToBottomRef = useRef(true);
  const conversationId = conversation.id;

  const messages = useInfiniteQuery({
    queryKey: messagingKeys.messages(conversationId),
    queryFn: ({ pageParam }) =>
      messagingApi.messages(conversationId, { before: pageParam, limit: MESSAGING_PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (oldest) =>
      oldest.length < MESSAGING_PAGE_SIZE ? undefined : oldest[0]?.createdAt,
    staleTime: Infinity,
  });

  const ordered = useMemo(
    () => (messages.data ? [...messages.data.pages].reverse().flat() : []),
    [messages.data],
  );
  const lastId = ordered[ordered.length - 1]?.id;

  // Đánh dấu đã đọc khi đang mở cuộc trò chuyện có tin mới (và tab đang hiện).
  useEffect(() => {
    if (conversation.unreadCount <= 0) return undefined;
    const markRead = () => {
      if (document.visibilityState !== 'visible') return;
      void messagingApi.markRead(conversationId).then(() => {
        void queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
        void queryClient.invalidateQueries({ queryKey: messagingKeys.unread() });
      });
    };
    markRead();
    document.addEventListener('visibilitychange', markRead);
    return () => document.removeEventListener('visibilitychange', markRead);
  }, [conversationId, conversation.unreadCount, queryClient]);

  const lastMessage = ordered[ordered.length - 1];
  const lastIsMine = lastMessage?.senderUserId === myUserId;

  // Tin mới -> cuộn xuống cuối; tải tin cũ -> giữ nguyên chỗ đang đọc.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (keepOffsetRef.current !== null) {
      el.scrollTop = el.scrollHeight - keepOffsetRef.current;
      keepOffsetRef.current = null;
      return;
    }
    if (stickToBottomRef.current || lastIsMine) {
      el.scrollTop = el.scrollHeight;
      stickToBottomRef.current = true;
    }
  }, [lastId, lastIsMine, messages.data?.pages.length]);

  function onScroll() {
    const el = scrollRef.current;
    if (el) stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function onMediaLoaded() {
    const el = scrollRef.current;
    if (el && stickToBottomRef.current && keepOffsetRef.current === null)
      el.scrollTop = el.scrollHeight;
  }

  const sendMutation = useMutation({
    mutationFn: (payload: { body?: string; imageUrl?: string }) =>
      messagingApi.send(conversationId, payload),
    onSuccess: (message) => {
      queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
        messagingKeys.messages(conversationId),
        (data) => appendMessageToCache(data, message),
      );
      void queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
    onError: (error) => toast.show(getErrorMessage(error, 'Chưa gửi được tin nhắn'), 'error'),
  });

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || sendMutation.isPending) return;
    sendMutation.mutate({ body }, { onSuccess: () => setDraft('') });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  async function onPickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await filesApi.upload('chat-images', file);
      sendMutation.mutate(
        { imageUrl: uploaded.url, body: draft.trim() || undefined },
        {
          onSuccess: () => setDraft(''),
        },
      );
    } catch (error) {
      toast.show(getErrorMessage(error, 'Không tải được ảnh lên'), 'error');
    } finally {
      setUploading(false);
    }
  }

  function loadOlder() {
    const el = scrollRef.current;
    if (el) keepOffsetRef.current = el.scrollHeight - el.scrollTop;
    void messages.fetchNextPage();
  }

  const peer = conversation.counterpart;
  const seenAt = conversation.counterpartLastReadAt
    ? new Date(conversation.counterpartLastReadAt)
    : null;
  const lastMine = [...ordered]
    .reverse()
    .find((m) => m.senderUserId === myUserId && m.kind !== 'CALL');
  const seenLastMine = Boolean(lastMine && seenAt && seenAt >= new Date(lastMine.createdAt));
  const callBusy = call ? call.state.phase !== 'idle' && call.state.phase !== 'ended' : true;

  return (
    <section
      aria-label={`Trò chuyện với ${peer.fullName}`}
      className="flex h-full min-h-0 flex-col"
    >
      <header className="flex items-center gap-3 border-b border-border px-3 py-2.5 sm:px-4">
        <Link
          to={basePath}
          aria-label="Quay lại danh sách"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-surface-muted lg:hidden"
        >
          <Icon name="chevron-left" />
        </Link>
        <Avatar name={peer.fullName} src={peer.avatarUrl} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-foreground">{peer.fullName}</h2>
          <p className="truncate text-xs text-muted">
            {viewer === 'owner'
              ? 'Bác sĩ thú y'
              : `Chủ thú cưng${peer.phone ? ` · ${peer.phone}` : ''}`}
          </p>
        </div>
        {call && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={callBusy}
              onClick={() => void call.startCall(conversationId, 'AUDIO', peer)}
              aria-label={`Gọi thoại cho ${peer.fullName}`}
              title="Gọi thoại"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="phone" />
            </button>
            <button
              type="button"
              disabled={callBusy}
              onClick={() => void call.startCall(conversationId, 'VIDEO', peer)}
              aria-label={`Gọi video cho ${peer.fullName}`}
              title="Gọi video"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="video" />
            </button>
          </div>
        )}
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto bg-surface-muted/40 px-3 py-4 sm:px-5"
      >
        {messages.isLoading ? (
          <div aria-busy="true" aria-label="Đang tải tin nhắn" className="space-y-3">
            <Skeleton className="h-10 w-2/3 rounded-xl" />
            <Skeleton className="ml-auto h-10 w-1/2 rounded-xl" />
            <Skeleton className="h-16 w-3/5 rounded-xl" />
          </div>
        ) : messages.isError ? (
          <QueryErrorState
            error={messages.error}
            title="Không tải được tin nhắn"
            onRetry={() => void messages.refetch()}
          />
        ) : ordered.length === 0 ? (
          <div
            role="status"
            className="flex h-full flex-col items-center justify-center text-center"
          >
            <span aria-hidden="true" className="text-3xl opacity-60">
              👋
            </span>
            <p className="mt-2 font-medium text-foreground">Bắt đầu cuộc trò chuyện</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {viewer === 'owner'
                ? `Gửi câu hỏi hoặc ảnh của bé cho ${peer.fullName}. Trường hợp khẩn cấp, hãy gọi hoặc đến phòng khám ngay.`
                : `Gửi lời dặn dò hoặc hỏi thăm ${peer.fullName} về tình trạng của bé.`}
            </p>
          </div>
        ) : (
          <ol className="space-y-1.5" aria-live="polite" aria-relevant="additions">
            {messages.hasNextPage && (
              <li className="flex justify-center pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  loading={messages.isFetchingNextPage}
                  onClick={loadOlder}
                >
                  Xem tin cũ hơn
                </Button>
              </li>
            )}
            {ordered.map((message, index) => {
              const mine = message.senderUserId === myUserId;
              const prev = ordered[index - 1];
              const showDay = !prev || dayKey(prev.createdAt) !== dayKey(message.createdAt);
              return (
                <li key={message.id}>
                  {showDay && (
                    <p className="py-2 text-center text-xs font-medium text-muted">
                      {formatDayDivider(message.createdAt)}
                    </p>
                  )}
                  {message.kind === 'CALL' ? (
                    <CallLogRow message={message} mine={mine} />
                  ) : (
                    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[80%] rounded-xl px-3 py-2 text-sm shadow-sm sm:max-w-[70%]',
                          mine
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-surface text-foreground',
                        )}
                      >
                        <span className="sr-only">{mine ? 'Bạn: ' : `${peer.fullName}: `}</span>
                        {message.imageUrl && (
                          <a
                            href={message.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={message.imageUrl}
                              alt="Ảnh đính kèm"
                              onLoad={onMediaLoaded}
                              className="max-h-64 rounded-lg object-cover"
                            />
                          </a>
                        )}
                        {message.body && (
                          <p
                            className={cn(
                              'whitespace-pre-wrap break-words',
                              message.imageUrl && 'mt-2',
                            )}
                          >
                            {message.body}
                          </p>
                        )}
                        <p
                          className={cn(
                            'mt-1 text-right text-[11px]',
                            mine ? 'text-primary-foreground/80' : 'text-muted',
                          )}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  {mine && message.id === lastMine?.id && seenLastMine && (
                    <p className="mt-0.5 text-right text-[11px] text-muted">Đã xem</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <form
        onSubmit={submit}
        className="flex items-end gap-2 border-t border-border bg-surface p-2 sm:p-3"
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void onPickImage(event)}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || sendMutation.isPending}
          aria-label="Gửi ảnh"
          title="Gửi ảnh"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          <Icon name="image" />
        </button>
        <label htmlFor={`composer-${conversationId}`} className="sr-only">
          Nội dung tin nhắn
        </label>
        <textarea
          id={`composer-${conversationId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={2000}
          placeholder={uploading ? 'Đang tải ảnh lên…' : 'Nhập tin nhắn…'}
          title="Enter để gửi, Shift+Enter để xuống dòng"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button
          type="submit"
          aria-label="Gửi tin nhắn"
          disabled={!draft.trim() || uploading}
          loading={sendMutation.isPending}
          className="h-11 w-11 shrink-0 px-0"
        >
          {!sendMutation.isPending && <Icon name="send" className="h-4 w-4" />}
        </Button>
      </form>
    </section>
  );
}
