import { createContext, useContext } from 'react';
import type { CallMedia } from '@/api/messaging.api';
import type { CallPeer, CallState } from './call-types';

export interface CallContextValue {
  state: CallState;
  startCall: (conversationId: string, media: CallMedia, peer: CallPeer) => Promise<void>;
  accept: () => Promise<void>;
  reject: () => void;
  hangUp: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  /** Bên kia đang thực sự gửi hình (track video không bị "muted"). */
  remoteVideoLive: boolean;
}

export const CallContext = createContext<CallContextValue | null>(null);

/** Trả về null khi người dùng không thuộc vai trò được gọi điện (khách, nhân viên khác). */
export function useCall(): CallContextValue | null {
  return useContext(CallContext);
}
