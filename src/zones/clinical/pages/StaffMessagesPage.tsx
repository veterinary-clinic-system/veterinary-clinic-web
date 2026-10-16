import { PageHeader } from '@/components/basic';
import { MessagingWorkspace } from '@/components/messaging/MessagingWorkspace';

export function StaffMessagesPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Tin nhắn"
        description="Trao đổi với chủ của các bé bạn đã hoặc đang khám — nhắn tin, gửi ảnh, gọi thoại/video."
      />
      <MessagingWorkspace
        basePath="/staff/messages"
        viewer="doctor"
        className="h-[calc(100vh-13rem)]"
      />
    </div>
  );
}
