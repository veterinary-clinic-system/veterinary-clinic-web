import { MessagingWorkspace } from '@/components/messaging/MessagingWorkspace';

export function MyMessagesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <span className="care-eyebrow">TRÒ CHUYỆN VỚI BÁC SĨ</span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tin nhắn</h1>
        <p className="mt-1 text-muted">
          Hỏi thêm bác sĩ đã khám cho bé, gửi ảnh tình trạng, hoặc gọi thoại/video khi cần.
        </p>
      </div>
      <MessagingWorkspace basePath="/my/messages" viewer="owner" />
    </div>
  );
}
