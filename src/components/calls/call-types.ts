import type { CallMedia, CallStatus } from '@/api/messaging.api';

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active' | 'ended';

export interface CallPeer {
  fullName: string;
  avatarUrl: string | null;
}

export interface CallState {
  phase: CallPhase;
  callId: string | null;
  conversationId: string | null;
  media: CallMedia;
  role: 'caller' | 'callee';
  peer: CallPeer;
  /** Lúc hai bên thực sự nối được (để đếm thời lượng). */
  connectedAt: number | null;
  micOn: boolean;
  camOn: boolean;
  /** Không lấy được micro/camera: vẫn nghe/xem được bên kia. */
  localMediaMissing: boolean;
  /** Câu hiện ở màn hình kết thúc. */
  endedText: string | null;
}

export const IDLE_CALL: CallState = {
  phase: 'idle',
  callId: null,
  conversationId: null,
  media: 'AUDIO',
  role: 'caller',
  peer: { fullName: '', avatarUrl: null },
  connectedAt: null,
  micOn: true,
  camOn: true,
  localMediaMissing: false,
  endedText: null,
};

/** Gói tín hiệu WebRTC chuyển qua máy chủ. */
export type SignalPayload =
  { description: RTCSessionDescriptionInit } | { candidate: RTCIceCandidateInit };

export function endedTextFor(
  status: CallStatus | 'ERROR',
  reason: string | undefined,
  peerName: string,
): string {
  if (reason === 'OFFLINE')
    return `${peerName} hiện không trực tuyến. Hãy nhắn tin để họ thấy khi mở ứng dụng.`;
  if (reason === 'BUSY') return `${peerName} đang trong một cuộc gọi khác.`;
  if (reason === 'DISCONNECTED') return 'Mất kết nối, cuộc gọi đã kết thúc.';
  if (reason === 'MEDIA_ERROR') return 'Không thiết lập được đường truyền âm thanh/hình ảnh.';
  switch (status) {
    case 'MISSED':
      return 'Không có người nhấc máy.';
    case 'REJECTED':
      return 'Cuộc gọi bị từ chối.';
    case 'CANCELLED':
      return 'Cuộc gọi đã huỷ.';
    case 'ENDED':
      return 'Cuộc gọi đã kết thúc.';
    default:
      return 'Không thực hiện được cuộc gọi.';
  }
}
