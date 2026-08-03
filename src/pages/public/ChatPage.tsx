import { FormEvent, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { aiChatApi, ChatMessage } from '@/api/prescreening.api';
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
    'Xin chào! Tôi là trợ lý AI hỗ trợ thông tin ban đầu về sức khỏe thú cưng. Bạn hãy mô tả các triệu chứng thú cưng đang gặp phải, tôi sẽ giúp bạn hiểu rõ hơn và gợi ý bước tiếp theo.',
};

export function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const mutation = useMutation({
    mutationFn: (payload: { message: string; history: ChatMessage[] }) =>
      aiChatApi.send({ sessionId, message: payload.message, history: payload.history }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || mutation.isPending) return;

    setError(null);
    const history: ChatMessage[] = messages
      .filter((m) => m.id !== WELCOME_MESSAGE.id)
      .map((m) => ({ role: m.role, content: m.content }));
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
          setError(getErrorMessage(err, 'Không thể gửi tin nhắn. Vui lòng thử lại.'));
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Trợ lý AI sàng lọc triệu chứng</h1>

      <div className="mt-3 rounded border border-border bg-surface-muted p-3 text-sm text-muted">
        <strong className="text-foreground">Lưu ý:</strong> Đây là trợ lý AI cung cấp thông tin tham khảo
        ban đầu, <strong>không thay thế</strong> chẩn đoán hoặc tư vấn y khoa của bác sĩ thú y. Nếu thú
        cưng có dấu hiệu nghiêm trọng, vui lòng đặt lịch khám hoặc liên hệ phòng khám ngay.
      </div>

      <div className="mt-4 flex max-h-[55vh] min-h-[320px] flex-col gap-4 overflow-y-auto rounded border border-border bg-surface p-4">
        {messages.map((message) => (
          <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                'max-w-[80%] whitespace-pre-wrap rounded-lg px-4 py-2 text-sm ' +
                (message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-muted text-foreground')
              }
            >
              <p>{message.content}</p>
              {message.suggestBooking && (
                <Link
                  to="/booking"
                  className="mt-2 inline-block rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  Đặt lịch khám
                </Link>
              )}
            </div>
          </div>
        ))}
        {mutation.isPending && <p className="text-sm text-muted">Trợ lý đang trả lời...</p>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mô tả triệu chứng thú cưng của bạn..."
          className="flex-1 rounded border border-border bg-surface px-3 py-2 text-foreground"
        />
        <button
          type="submit"
          disabled={mutation.isPending || !input.trim()}
          className="rounded bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-60"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
