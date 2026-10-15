import { ChangeEvent, FormEvent, Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { aiChatApi, AiChatBooking, AiChatDraft, AiChatResponse } from '@/api/prescreening.api';
import { filesApi } from '@/api/files.api';
import { Alert, Avatar, Button, Icon, TriageBadge, cn } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/enums';
import { getErrorMessage } from '@/utils/errors';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  videos?: string[];
  response?: AiChatResponse;
}

interface PendingAttachment {
  id: string;
  file: File;
  type: 'image' | 'video';
  previewUrl: string;
}

// Khớp giới hạn của backend: /files/upload (loại tệp, dung lượng) và /ai-chat (số lượng).
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_IMAGES = 5;
const MAX_VIDEOS = 2;
const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 100;

const WELCOME_MESSAGE: DisplayMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! Em là **Trợ lý AI VetCare**.\n\n' +
    '1. **Đánh giá sơ bộ sức khoẻ**: mô tả triệu chứng, hoặc gửi ảnh/video của bé.\n' +
    '2. **Đặt lịch khám tự động**: em sẽ hỏi những thông tin còn thiếu rồi đặt lịch ngay.\n' +
    '3. **Lịch tiêm phòng, lịch tái khám**: tra cứu khi bạn đã đăng nhập.\n\n' +
    'Xác nhận lịch hẹn, nhắc lịch tiêm và nhắc tái khám được gửi qua **Zalo** và **Gmail**.',
};

const SUGGESTED_QUESTIONS = [
  'Bé cún nhà em bị nôn mửa và bỏ ăn 2 ngày nay, có nguy hiểm không?',
  'Mèo bị ngứa và rụng lông thành từng mảng tròn, nên làm gì?',
  'Tôi muốn đặt lịch khám tổng quát cho bé mèo tại chi nhánh Quận 1 vào sáng mai',
  'Lịch tiêm phòng cho chó con gồm những mũi nào?',
];

const QUICK_ACTIONS: Array<{ label: string; message: string; icon: 'calendar' | 'syringe' | 'stethoscope' }> = [
  { label: 'Đặt lịch khám', message: 'Tôi muốn đặt lịch khám cho bé', icon: 'calendar' },
  { label: 'Lịch tiêm phòng', message: 'Bé nhà em có lịch tiêm vắc-xin nào sắp tới không?', icon: 'syringe' },
  { label: 'Lịch tái khám', message: 'Kiểm tra lịch tái khám cho bé', icon: 'stethoscope' },
];

/** Markdown tối giản mà trợ lý dùng: **đậm**, _nghiêng_, và dòng "---" ngăn đoạn. */
function renderRichText(content: string): ReactNode {
  return content.split('\n').map((line, lineIndex, lines) => {
    if (line.trim() === '---') {
      return <hr key={lineIndex} className="my-2 border-border" />;
    }
    const parts = line.split(/(\*\*[^*]+\*\*|(?<![\p{L}\d])_[^_]+_(?![\p{L}\d]))/u).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.length > 2 && part.startsWith('_') && part.endsWith('_')) {
        return (
          <em key={index} className="text-muted">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <Fragment key={index}>{part}</Fragment>;
    });
    return (
      <Fragment key={lineIndex}>
        {parts}
        {lineIndex < lines.length - 1 && '\n'}
      </Fragment>
    );
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const CHANNEL_LABEL: Record<string, string> = { ZALO: 'Zalo', EMAIL: 'Gmail', SMS: 'SMS' };

function BookingCard({ booking, notifications }: { booking: AiChatBooking; notifications: AiChatResponse['notifications'] }) {
  return (
    <div className="mt-1 rounded-xl border border-success/40 bg-success-soft p-4 text-foreground">
      <p className="flex items-center gap-2 font-semibold text-success">
        <Icon name="check" className="h-4 w-4" />
        Đã đặt lịch thành công
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        <div>
          <dt className="inline text-muted">Bé: </dt>
          <dd className="inline font-semibold">{booking.petName}</dd>
        </div>
        <div>
          <dt className="inline text-muted">Thời gian: </dt>
          <dd className="inline font-semibold">{formatDateTime(booking.startAt)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="inline text-muted">Chi nhánh: </dt>
          <dd className="inline font-semibold">
            {booking.branchName} <span className="font-normal text-muted">- {booking.branchAddress}</span>
          </dd>
        </div>
        <div>
          <dt className="inline text-muted">Dịch vụ: </dt>
          <dd className="inline font-semibold">{booking.serviceName}</dd>
        </div>
        <div>
          <dt className="inline text-muted">Mã lịch hẹn: </dt>
          <dd className="inline font-mono font-semibold">#{booking.code}</dd>
        </div>
      </dl>

      <ul className="mt-3 flex flex-wrap gap-2 border-t border-success/20 pt-3" aria-label="Kết quả gửi xác nhận">
        {(notifications?.deliveries ?? []).map((delivery) => {
          const sent = delivery.status === 'SENT';
          return (
            <li
              key={delivery.channel}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                sent ? 'bg-surface text-success' : 'bg-warning-soft text-warning',
              )}
            >
              <Icon name={delivery.channel === 'EMAIL' ? 'mail' : 'phone'} className="h-3 w-3" />
              {CHANNEL_LABEL[delivery.channel] ?? delivery.channel}: {sent ? 'đã gửi' : 'chưa gửi được, sẽ thử lại'}
            </li>
          );
        })}
        {!notifications?.deliveries.length && (
          <li className="text-[11px] text-warning">Chưa gửi được tin xác nhận - lễ tân sẽ liên hệ lại.</li>
        )}
      </ul>
      {notifications?.simulated && (
        <p className="mt-2 text-[11px] text-muted">Môi trường thử nghiệm: tin nhắn chỉ được ghi log, chưa gửi thật.</p>
      )}
    </div>
  );
}

export function ChatPage() {
  const { user } = useAuth();
  const isOwner = user?.role === Role.PET_OWNER;

  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState<AiChatDraft | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isUploadingFiles]);

  // Giải phóng ảnh xem trước còn treo khi rời trang.
  useEffect(() => () => attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl)), []);

  const mutation = useMutation({ mutationFn: aiChatApi.send });
  const busy = mutation.isPending || isUploadingFiles;

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    const accepted: PendingAttachment[] = [];
    const problems: string[] = [];
    let images = attachments.filter((a) => a.type === 'image').length;
    let videos = attachments.filter((a) => a.type === 'video').length;

    for (const file of files) {
      const isImage = IMAGE_TYPES.includes(file.type);
      const isVideo = VIDEO_TYPES.includes(file.type);
      const sizeMb = file.size / 1024 / 1024;
      if (!isImage && !isVideo) {
        problems.push(`${file.name}: chỉ nhận ảnh JPG/PNG/WEBP hoặc video MP4/MOV/WEBM`);
      } else if (isImage && sizeMb > MAX_IMAGE_MB) {
        problems.push(`${file.name}: ảnh vượt quá ${MAX_IMAGE_MB} MB`);
      } else if (isVideo && sizeMb > MAX_VIDEO_MB) {
        problems.push(`${file.name}: video vượt quá ${MAX_VIDEO_MB} MB`);
      } else if (isImage && images >= MAX_IMAGES) {
        problems.push(`Tối đa ${MAX_IMAGES} ảnh mỗi lần gửi`);
      } else if (isVideo && videos >= MAX_VIDEOS) {
        problems.push(`Tối đa ${MAX_VIDEOS} video mỗi lần gửi`);
      } else {
        if (isImage) images += 1;
        else videos += 1;
        accepted.push({
          id: crypto.randomUUID(),
          file,
          type: isVideo ? 'video' : 'image',
          previewUrl: URL.createObjectURL(file),
        });
      }
    }

    setAttachments((prev) => [...prev, ...accepted]);
    setError(problems.length > 0 ? [...new Set(problems)].join('. ') : null);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  function clearAttachments() {
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
  }

  async function uploadPendingFiles(): Promise<{ images: string[]; videos: string[] }> {
    setIsUploadingFiles(true);
    try {
      const uploaded = await Promise.all(
        attachments.map(async (att) => ({
          type: att.type,
          url: (await filesApi.upload(att.type === 'image' ? 'symptom-photos' : 'symptom-videos', att.file)).url,
        })),
      );
      clearAttachments();
      return {
        images: uploaded.filter((u) => u.type === 'image').map((u) => u.url),
        videos: uploaded.filter((u) => u.type === 'video').map((u) => u.url),
      };
    } finally {
      setIsUploadingFiles(false);
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || busy) return;

    setError(null);
    let media = { images: [] as string[], videos: [] as string[] };
    if (attachments.length > 0) {
      try {
        media = await uploadPendingFiles();
      } catch (uploadError) {
        setError(getErrorMessage(uploadError, 'Không tải lên được ảnh/video. Vui lòng thử lại.'));
        return;
      }
    }

    const content =
      trimmed || (media.videos.length > 0 ? 'Em gửi video tình trạng của bé' : 'Em gửi ảnh triệu chứng của bé');
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        images: media.images.length > 0 ? media.images : undefined,
        videos: media.videos.length > 0 ? media.videos : undefined,
      },
    ]);
    setInput('');

    mutation.mutate(
      { sessionId, message: content, images: media.images, videos: media.videos, draft },
      {
        onSuccess: (response) => {
          setSessionId(response.sessionId);
          setDraft(response.draft);
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: 'assistant', content: response.reply, response },
          ]);
          inputRef.current?.focus();
        },
        onError: (sendError) => {
          setError(getErrorMessage(sendError, 'Không gửi được tin nhắn. Vui lòng thử lại.'));
        },
      },
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  const lastMessageId = messages[messages.length - 1]?.id;

  return (
    <div className="pet-chat mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <Icon name="sparkles" className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Trợ lý AI sức khoẻ & đặt lịch
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Mô tả triệu chứng, gửi ảnh hoặc video để được đánh giá sơ bộ; trợ lý tự đặt lịch khám và gửi xác nhận qua
            Zalo, Gmail.
          </p>
        </div>
      </div>

      <Alert tone="warning" className="mt-4 text-xs sm:text-sm">
        Đánh giá của AI chỉ mang tính sàng lọc ban đầu. Nếu bé khó thở, co giật hoặc chảy máu, hãy đưa bé tới phòng
        khám ngay.
      </Alert>

      {!isOwner && (
        <p className="mt-3 text-xs text-muted">
          <Link to="/login" state={{ from: { pathname: '/chat' } }} className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>{' '}
          để trợ lý dùng hồ sơ bé có sẵn, không phải hỏi lại số điện thoại, và tra cứu được lịch tiêm, lịch tái khám.
        </p>
      )}

      <div
        role="log"
        aria-live="polite"
        aria-label="Nội dung trò chuyện"
        className="mt-4 flex max-h-[60vh] min-h-[380px] flex-col gap-5 overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6"
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const response = message.response;
          const isLatest = message.id === lastMessageId;

          return (
            <div key={message.id} className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
              {isUser ? (
                <Avatar name="Bạn" size="sm" />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <Icon name="sparkles" className="h-4 w-4" />
                </span>
              )}

              <div
                className={cn(
                  'flex max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[78%]',
                  isUser ? 'bg-primary text-primary-foreground' : 'border border-border bg-surface-muted text-foreground',
                )}
              >
                {response?.triage && (
                  <div>
                    <TriageBadge color={response.triage.priorityColor} />
                  </div>
                )}

                {message.images && (
                  <div className="flex flex-wrap gap-2">
                    {message.images.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg">
                        <img src={url} alt="Ảnh triệu chứng" className="h-28 w-28 object-cover sm:h-36 sm:w-36" loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
                {message.videos?.map((url) => (
                  <video key={url} src={url} controls className="max-h-56 max-w-full rounded-lg bg-foreground" />
                ))}

                <div className="whitespace-pre-wrap leading-relaxed">{renderRichText(message.content)}</div>

                {response?.booking && <BookingCard booking={response.booking} notifications={response.notifications} />}

                {response?.requiresLogin && !isOwner && (
                  <div>
                    <Link
                      to="/login"
                      state={{ from: { pathname: '/chat' } }}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Icon name="user" className="h-3.5 w-3.5" />
                      Đăng nhập để xem lịch của bé
                    </Link>
                  </div>
                )}

                {isLatest && response && response.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1" aria-label="Trả lời nhanh">
                    {response.quickReplies.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        disabled={busy}
                        onClick={() => void send(reply)}
                        className="rounded-full border border-primary/40 bg-surface px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/10 disabled:opacity-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {isLatest && response?.suggestBooking && !response.booking && (
                  <Link to="/booking" className="text-xs font-medium text-muted underline-offset-2 hover:text-primary hover:underline">
                    Hoặc tự chọn bác sĩ & giờ khám
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted" role="status">
            <Icon name="sparkles" className="h-4 w-4 animate-pulse text-primary" />
            {isUploadingFiles ? 'Đang tải ảnh/video lên...' : 'Trợ lý đang phân tích...'}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Gợi ý câu hỏi</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SUGGESTED_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => void send(question)}
                className="rounded-xl border border-border bg-surface p-3 text-left text-xs text-foreground transition hover:border-primary/40 hover:bg-primary/5 sm:text-sm"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <Alert tone="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {attachments.length > 0 && (
        <div className="mt-3 rounded-2xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Tệp đính kèm ({attachments.length})</span>
            <button type="button" onClick={clearAttachments} className="text-muted hover:text-danger">
              Xoá tất cả
            </button>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2.5">
            {attachments.map((att) => (
              <li
                key={att.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted p-1.5 pr-2 text-xs"
              >
                {att.type === 'image' ? (
                  <img src={att.previewUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <video src={att.previewUrl} muted className="h-12 w-12 rounded-lg bg-foreground object-cover" />
                )}
                <span className="flex max-w-[160px] flex-col">
                  <span className="truncate font-medium text-foreground">{att.file.name}</span>
                  <span className="text-[10px] text-muted">
                    {(att.file.size / 1024 / 1024).toFixed(1)} MB · {att.type === 'image' ? 'Ảnh' : 'Video'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  aria-label={`Bỏ ${att.file.name}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                >
                  <Icon name="close" className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40">
          <input
            ref={fileInputRef}
            type="file"
            accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(',')}
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            aria-label="Đính kèm ảnh hoặc video triệu chứng"
            title="Đính kèm ảnh hoặc video triệu chứng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-muted hover:text-primary disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            maxLength={2000}
            onChange={(event) => setInput(event.target.value)}
            aria-label="Tin nhắn cho trợ lý"
            placeholder={
              attachments.length > 0
                ? 'Mô tả thêm về ảnh/video (hoặc bấm Gửi)...'
                : 'Mô tả triệu chứng của bé, hoặc nhắn để đặt lịch khám...'
            }
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          <Button
            type="submit"
            size="md"
            disabled={(!input.trim() && attachments.length === 0) || busy}
            loading={busy}
            className="rounded-xl px-5 font-semibold"
          >
            Gửi
          </Button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 px-1 text-xs">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={busy}
            onClick={() => void send(action.message)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            <Icon name={action.icon} className="h-3.5 w-3.5" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
