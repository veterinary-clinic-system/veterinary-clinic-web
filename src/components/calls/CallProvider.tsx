import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { CallMedia, CallStatus, messagingApi } from '@/api/messaging.api';
import { emitWithAck } from '@/api/messaging-socket';
import { useToast } from '@/components/basic';
import { CallContext, CallContextValue } from './call-context';
import { CallOverlay } from './CallOverlay';
import { CallPeer, CallState, IDLE_CALL, SignalPayload, endedTextFor } from './call-types';

/** Màn hình "đã kết thúc" hiện bao lâu rồi tự đóng. */
const ENDED_SCREEN_MS = 2500;

interface IncomingEvent {
  callId: string;
  conversationId: string;
  media: CallMedia;
  caller: { userId: string; fullName: string; avatarUrl: string | null };
}

async function acquireMedia(media: CallMedia): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null;
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: media === 'VIDEO' });
  } catch {
    // Không có camera thì thử chỉ micro - gọi video vẫn xem được bên kia.
    if (media === 'VIDEO') {
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Quản lý cuộc gọi thoại/video WebRTC cho chủ nuôi và bác sĩ. Một cuộc gọi tại một thời
 * điểm. Máy chủ chỉ làm tổng đài + chuyển tín hiệu; người gọi tạo offer sau khi bên kia
 * nhận máy, nên chỉ đúng tab đã nhận máy mới bắt tay WebRTC.
 */
export function CallProvider({ socket, children }: { socket: Socket | null; children: ReactNode }) {
  const toast = useToast();
  const [state, setState] = useState<CallState>(IDLE_CALL);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteVideoLive, setRemoteVideoLive] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  // Đọc qua hàm để TypeScript không thu hẹp kiểu qua các lần await (ref đổi giữa chừng).
  const phaseNow = useCallback(() => stateRef.current.phase, []);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const iceServersRef = useRef<RTCIceServer[] | null>(null);
  const endedTimer = useRef<number | null>(null);

  const patch = useCallback((next: Partial<CallState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const releaseMedia = useCallback(() => {
    pcRef.current?.getSenders().forEach((sender) => sender.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localRef.current?.getTracks().forEach((track) => track.stop());
    localRef.current = null;
    pendingCandidates.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteVideoLive(false);
  }, []);

  const showEnded = useCallback(
    (text: string) => {
      releaseMedia();
      patch({ phase: 'ended', endedText: text });
      if (endedTimer.current) window.clearTimeout(endedTimer.current);
      endedTimer.current = window.setTimeout(() => setState(IDLE_CALL), ENDED_SCREEN_MS);
    },
    [patch, releaseMedia],
  );

  const iceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    if (iceServersRef.current) return iceServersRef.current;
    try {
      iceServersRef.current = (await messagingApi.rtcConfig()).iceServers;
    } catch {
      iceServersRef.current = [];
    }
    return iceServersRef.current;
  }, []);

  const sendSignal = useCallback((callId: string, data: SignalPayload) => {
    void emitWithAck('call:signal', { callId, data });
  }, []);

  const createPeer = useCallback(
    async (callId: string, media: CallMedia): Promise<RTCPeerConnection> => {
      const pc = new RTCPeerConnection({ iceServers: await iceServers() });
      pcRef.current = pc;

      const local = localRef.current;
      if (local) {
        local.getTracks().forEach((track) => pc.addTrack(track, local));
      }
      // Thiếu thiết bị nào thì vẫn xin nhận chiều đó từ bên kia.
      if (!local?.getAudioTracks().length) pc.addTransceiver('audio', { direction: 'recvonly' });
      if (media === 'VIDEO' && !local?.getVideoTracks().length) {
        pc.addTransceiver('video', { direction: 'recvonly' });
      }

      const remote = new MediaStream();
      setRemoteStream(remote);
      pc.ontrack = (event) => {
        if (event.track.kind === 'video') {
          const track = event.track;
          setRemoteVideoLive(!track.muted);
          track.onunmute = () => setRemoteVideoLive(true);
          track.onmute = () => setRemoteVideoLive(false);
          track.onended = () => setRemoteVideoLive(false);
        }
        event.streams[0]?.getTracks().forEach((track) => {
          if (!remote.getTracks().includes(track)) remote.addTrack(track);
        });
        if (!event.streams[0] && !remote.getTracks().includes(event.track))
          remote.addTrack(event.track);
        // Đổi tham chiếu để thẻ <video>/<audio> gắn lại nguồn.
        setRemoteStream(new MediaStream(remote.getTracks()));
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) sendSignal(callId, { candidate: event.candidate.toJSON() });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected' && stateRef.current.phase !== 'active') {
          patch({ phase: 'active', connectedAt: Date.now() });
        }
        if (pc.connectionState === 'failed' && stateRef.current.callId === callId) {
          void emitWithAck('call:end', { callId, reason: 'MEDIA_ERROR' });
        }
      };
      return pc;
    },
    [iceServers, patch, sendSignal],
  );

  const flushCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const queued = pendingCandidates.current;
    pendingCandidates.current = [];
    for (const candidate of queued) {
      await pc.addIceCandidate(candidate).catch(() => undefined);
    }
  }, []);

  // --- Sự kiện từ máy chủ ---------------------------------------------------------
  useEffect(() => {
    if (!socket) return undefined;
    const onIncoming = (event: IncomingEvent) => {
      if (stateRef.current.phase !== 'idle' && stateRef.current.phase !== 'ended') return;
      if (endedTimer.current) window.clearTimeout(endedTimer.current);
      setState({
        ...IDLE_CALL,
        phase: 'incoming',
        role: 'callee',
        callId: event.callId,
        conversationId: event.conversationId,
        media: event.media,
        peer: { fullName: event.caller.fullName, avatarUrl: event.caller.avatarUrl },
      });
    };

    const onAccepted = async (event: { callId: string; calleeSocketId: string }) => {
      const current = stateRef.current;
      if (current.callId !== event.callId) return;
      if (current.role === 'callee') {
        // Tab khác của mình đã nhận máy: tắt chuông ở tab này.
        if (event.calleeSocketId !== socket?.id) {
          releaseMedia();
          setState(IDLE_CALL);
        }
        return;
      }
      patch({ phase: 'connecting' });
      try {
        const pc = await createPeer(event.callId, current.media);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(event.callId, { description: offer });
      } catch {
        void emitWithAck('call:end', { callId: event.callId, reason: 'MEDIA_ERROR' });
      }
    };

    const onSignal = async (event: { callId: string; data: SignalPayload }) => {
      const pc = pcRef.current;
      if (!pc || stateRef.current.callId !== event.callId) return;
      try {
        if ('description' in event.data) {
          await pc.setRemoteDescription(event.data.description);
          await flushCandidates(pc);
          if (event.data.description.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal(event.callId, { description: answer });
          }
        } else if ('candidate' in event.data) {
          if (pc.remoteDescription) await pc.addIceCandidate(event.data.candidate);
          else pendingCandidates.current.push(event.data.candidate);
        }
      } catch {
        void emitWithAck('call:end', { callId: event.callId, reason: 'MEDIA_ERROR' });
      }
    };

    const onEnded = (event: { callId: string; status: CallStatus; reason?: string }) => {
      const current = stateRef.current;
      if (current.callId !== event.callId) return;
      // Người nhận tự từ chối/bỏ lỡ thì không cần màn hình kết thúc.
      if (current.phase === 'incoming') {
        releaseMedia();
        setState(IDLE_CALL);
        if (event.status === 'MISSED' || event.status === 'CANCELLED') {
          toast.show(`Cuộc gọi nhỡ từ ${current.peer.fullName}`, 'info');
        }
        return;
      }
      showEnded(endedTextFor(event.status, event.reason, current.peer.fullName));
    };

    socket.on('call:incoming', onIncoming);
    socket.on('call:accepted', onAccepted);
    socket.on('call:signal', onSignal);
    socket.on('call:ended', onEnded);
    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:accepted', onAccepted);
      socket.off('call:signal', onSignal);
      socket.off('call:ended', onEnded);
    };
  }, [socket, createPeer, flushCandidates, patch, releaseMedia, sendSignal, showEnded, toast]);

  // Đóng tab giữa cuộc gọi: máy chủ tự kết thúc khi socket rớt; ở đây chỉ dọn thiết bị.
  useEffect(() => () => releaseMedia(), [releaseMedia]);

  // --- Hành động của người dùng ------------------------------------------------------
  const startCall = useCallback(
    async (conversationId: string, media: CallMedia, peer: CallPeer) => {
      if (stateRef.current.phase !== 'idle' && stateRef.current.phase !== 'ended') {
        toast.show('Bạn đang trong một cuộc gọi khác', 'error');
        return;
      }
      if (endedTimer.current) window.clearTimeout(endedTimer.current);
      setState({ ...IDLE_CALL, phase: 'outgoing', role: 'caller', conversationId, media, peer });

      const local = await acquireMedia(media);
      if (phaseNow() !== 'outgoing') {
        local?.getTracks().forEach((track) => track.stop());
        return;
      }
      localRef.current = local;
      setLocalStream(local);
      patch({
        localMediaMissing: !local,
        camOn: Boolean(local?.getVideoTracks().length),
      });

      const ack = await emitWithAck<{
        ok: boolean;
        error?: string;
        callId?: string;
        status?: CallStatus;
        reason?: string;
      }>('call:invite', { conversationId, media });
      if (!ack.ok || !ack.callId) {
        showEnded(ack.error ?? 'Không thực hiện được cuộc gọi.');
        return;
      }
      if (phaseNow() !== 'outgoing') {
        // Người dùng đã bấm huỷ trong lúc chờ máy chủ: huỷ luôn cuộc gọi vừa tạo.
        void emitWithAck('call:end', { callId: ack.callId });
        return;
      }
      patch({ callId: ack.callId });
      if (ack.status && ack.status !== 'RINGING') {
        showEnded(endedTextFor(ack.status, ack.reason, peer.fullName));
      }
    },
    [patch, phaseNow, showEnded, toast],
  );

  const accept = useCallback(async () => {
    const current = stateRef.current;
    if (current.phase !== 'incoming' || !current.callId) return;
    patch({ phase: 'connecting' });

    const local = await acquireMedia(current.media);
    if (phaseNow() !== 'connecting' || stateRef.current.callId !== current.callId) {
      // Người gọi đã huỷ trong lúc trình duyệt hỏi quyền micro/camera.
      local?.getTracks().forEach((track) => track.stop());
      return;
    }
    localRef.current = local;
    setLocalStream(local);
    patch({ localMediaMissing: !local, camOn: Boolean(local?.getVideoTracks().length) });

    // Tạo sẵn kết nối trước khi báo nhận máy để không lỡ offer đến sớm.
    await createPeer(current.callId, current.media);
    const ack = await emitWithAck('call:accept', { callId: current.callId });
    if (!ack.ok) {
      releaseMedia();
      setState(IDLE_CALL);
      toast.show(ack.error ?? 'Cuộc gọi đã kết thúc', 'info');
    }
  }, [createPeer, patch, phaseNow, releaseMedia, toast]);

  const reject = useCallback(() => {
    const current = stateRef.current;
    if (!current.callId) return;
    void emitWithAck('call:reject', { callId: current.callId });
    releaseMedia();
    setState(IDLE_CALL);
  }, [releaseMedia]);

  const hangUp = useCallback(() => {
    const current = stateRef.current;
    if (current.callId) {
      void emitWithAck('call:end', { callId: current.callId });
      // Máy chủ sẽ gửi call:ended; nếu mất mạng thì tự đóng sau thời gian chờ ack.
      showEnded('Cuộc gọi đã kết thúc.');
    } else {
      showEnded('Cuộc gọi đã huỷ.');
    }
  }, [showEnded]);

  const toggleMic = useCallback(() => {
    const tracks = localRef.current?.getAudioTracks() ?? [];
    const next = !stateRef.current.micOn;
    tracks.forEach((track) => (track.enabled = next));
    patch({ micOn: next });
  }, [patch]);

  const toggleCam = useCallback(() => {
    const tracks = localRef.current?.getVideoTracks() ?? [];
    if (tracks.length === 0) return;
    const next = !stateRef.current.camOn;
    tracks.forEach((track) => (track.enabled = next));
    patch({ camOn: next });
  }, [patch]);

  const value = useMemo<CallContextValue | null>(
    () =>
      socket
        ? {
            state,
            startCall,
            accept,
            reject,
            hangUp,
            toggleMic,
            toggleCam,
            localStream,
            remoteStream,
            remoteVideoLive,
          }
        : null,
    [
      socket,
      state,
      startCall,
      accept,
      reject,
      hangUp,
      toggleMic,
      toggleCam,
      localStream,
      remoteStream,
      remoteVideoLive,
    ],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallOverlay />
    </CallContext.Provider>
  );
}
