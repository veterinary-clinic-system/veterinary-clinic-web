import { FormEvent, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { aiChatApi, ChatMessage } from '@/api/prescreening.api';
import { Alert, Avatar, Button, Icon, cn } from '@/components/basic';
import { getErrorMessage } from '@/utils/errors';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestBooking?: boolean;
}

const WELCOME_MESSAGE: DisplayMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! Tôi là trợ lý AI hỗ trợ thông tin ban đầu về sức khoẻ thú cưng. Bạn hãy mô tả các triệu chứng bé đang gặp phải - kèm giống loài, tuổi và thời gian xuất hiện triệu chứng nếu biết - tôi sẽ giúp bạn hiểu rõ hơn và gợi ý bước tiếp theo.',
};

/**
 * Câu hỏi gợi ý.
 *
 * Không phải trang trí: màn hình trò chuyện trống là một trong những giao diện khó bắt
 * đầu nhất - người dùng không biết hỏi ở mức chi tiết nào. Ba ví dụ cụ thể (có giống
 * loài, có thời gian, có triệu chứng) dạy cách mô tả nhanh hơn mọi lời hướng dẫn.
 */
const SUGGESTED_QUESTIONS = [
  'Chó Poodle 2 tuổi của tôi bị nôn và bỏ ăn hai ngày nay, có nghiêm trọng không?',
  'Mèo nhà tôi rụng lông nhiều và gãi liên tục, tôi nên làm gì trước khi đưa đi khám?',
  'Chó con 3 tháng tuổi cần tiêm những mũi vắc-xin nào?',
];

/**
 * Trang tư vấn cùng trợ lý AI.
 *
 * Định vị xuyên suốt: **hỗ trợ tham khảo, không thay thế bác sĩ**. Điều đó thể hiện
 * bằng ba quyết định giao diện, không chỉ bằng một dòng miễn trừ:
 *
 * - Câu miễn trừ nằm TRÊN khung trò chuyện, đọc trước khi gõ chữ đầu tiên.
 * - Lời mời đặt lịch với bác sĩ thật luôn hiện, không chỉ khi AI gợi ý.
 * - Bong bóng của trợ lý không có avatar hình người và không gọi nó là "bác sĩ".
 */
export function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const mutation = useMutation({
    mutationFn: (payload: { message: string; history: ChatMessage[] }) =>
      aiChatApi.send({ sessionId, message: payload.message, history: payload.history }),
  });

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;

    setError(null);
    const history: ChatMessage[] = messages
      .filter((message) => message.id !== WELCOME_MESSAGE.id)
      .map((message) => ({ role: message.role, content: message.content }));

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: trimmed }]);
    setInput('');

    mutation.mutate(
      { message: trimmed, history },
      {
        onSuccess: (response) => {
          setSessionId(response.session_id);
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: response.reply,
              suggestBooking: response.suggest_booking,
            },
          ]);
        },
        onError: (err) => {
          setError(getErrorMessage(err, 'Không gửi được tin nhắn. Vui lòng thử lại.'));
        },
      },
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  /* Chỉ gợi ý khi hội thoại chưa bắt đầu - giữa cuộc trò chuyện thì chúng thành nhiễu. */
  const showSuggestions = messages.length === 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Tư vấn cùng trợ lý AI
      </h1>
      <p className="mt-1 text-muted">
        Mô tả triệu chứng để hiểu tình trạng ban đầu của bé và biết khi nào cần đưa tới phòng khám.
      </p>

      <Alert tone="warning" className="mt-5">
        Trợ lý AI chỉ cung cấp thông tin tham khảo, <strong>không thay thế</strong> chẩn đoán của bác
        sĩ thú y. Nếu bé có dấu hiệu nghiêm trọng (khó thở, co giật, chảy máu, bỏ ăn kéo dài), hãy
        đưa tới phòng khám ngay.
      </Alert>

      {/*
        `role="log"` + `aria-live="polite"`: trình đọc màn hình đọc câu trả lời mới khi
        nó xuất hiện mà không cắt ngang thứ người dùng đang nghe.
      */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Nội dung trò chuyện"
        className="mt-5 flex max-h-[55vh] min-h-[340px] flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-surface p-4"
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div key={message.id} className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}>
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
                  'max-w-[80%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-muted text-foreground',
                )}
              >
                <p>{message.content}</p>
                {message.suggestBooking && (
                  <Link
                    to="/booking"
                    className="mt-3 inline-flex min-h-touch items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Đặt lịch khám với bác sĩ
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {mutation.isPending && (
          <p role="status" className="text-sm text-muted">
            Trợ lý đang trả lời...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {showSuggestions && (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Gợi ý câu hỏi</p>
          <ul className="mt-2 flex flex-col gap-2">
            {SUGGESTED_QUESTIONS.map((question) => (
              <li key={question}>
                <button
                  type="button"
                  onClick={() => {
                    send(question);
                    inputRef.current?.focus();
                  }}
                  className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft"
                >
                  {question}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="Mô tả triệu chứng của thú cưng"
          placeholder="Mô tả triệu chứng thú cưng của bạn..."
          className="h-11 flex-1 rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" size="lg" disabled={!input.trim()} loading={mutation.isPending}>
          Gửi
        </Button>
      </form>

      <p className="mt-5 border-t border-border pt-5 text-sm text-muted">
        Cần bác sĩ xem trực tiếp?{' '}
        <Link to="/booking" className="font-medium text-primary hover:underline">
          Đặt lịch khám với bác sĩ thú y
        </Link>
      </p>
    </div>
  );
}
