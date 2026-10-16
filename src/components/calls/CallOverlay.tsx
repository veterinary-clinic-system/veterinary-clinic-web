import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, Button, Icon, IconName, cn } from '@/components/basic';
import { useCall } from './call-context';
import { useRingtone } from './use-ringtone';

function MediaView({
  stream,
  muted,
  className,
  kind,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
  kind: 'video' | 'audio';
}) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream;
  }, [stream]);
  return kind === 'video' ? (
    <video ref={ref} autoPlay playsInline muted={muted} className={className} />
  ) : (
    <audio ref={ref} autoPlay />
  );
}

function useElapsed(since: number | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [since]);
  if (!since) return '';
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function ControlButton({
  icon,
  label,
  onClick,
  active = true,
  danger = false,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={danger ? undefined : !active}
      title={label}
      className={cn(
        'flex h-14 w-14 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-foreground',
        danger
          ? 'bg-destructive text-primary-foreground hover:bg-destructive/90'
          : active
            ? 'bg-surface/15 text-surface hover:bg-surface/25'
            : 'bg-surface text-foreground hover:bg-surface/90',
      )}
    >
      <Icon name={icon} className="h-6 w-6" />
    </button>
  );
}

/** Giao diện cuộc gọi: thẻ cuộc gọi đến, và màn hình đang gọi/đang nói chuyện/kết thúc. */
export function CallOverlay() {
  const call = useCall();
  const phase = call?.state.phase ?? 'idle';
  useRingtone(phase === 'incoming' ? 'incoming' : phase === 'outgoing' ? 'outgoing' : null);
  const elapsed = useElapsed(call?.state.phase === 'active' ? call.state.connectedAt : null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (phase === 'incoming' || phase === 'outgoing') primaryRef.current?.focus();
  }, [phase]);

  if (!call || phase === 'idle') return null;
  const { state, localStream, remoteStream, remoteVideoLive } = call;
  const isVideo = state.media === 'VIDEO';
  const mediaLabel = isVideo ? 'cuộc gọi video' : 'cuộc gọi thoại';

  if (phase === 'incoming') {
    return createPortal(
      <div
        role="alertdialog"
        aria-modal="false"
        aria-labelledby="incoming-call-title"
        className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-sm rounded-xl border border-border bg-surface p-5 shadow-lg sm:inset-x-auto sm:bottom-6 sm:right-6"
      >
        <div className="flex items-center gap-3">
          <Avatar name={state.peer.fullName} src={state.peer.avatarUrl} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              {isVideo ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến'}
            </p>
            <h2
              id="incoming-call-title"
              className="truncate text-base font-semibold text-foreground"
            >
              {state.peer.fullName}
            </h2>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="destructive" onClick={call.reject}>
            <Icon name="phone-off" className="h-4 w-4" />
            Từ chối
          </Button>
          <Button ref={primaryRef} onClick={() => void call.accept()}>
            <Icon name={isVideo ? 'video' : 'phone'} className="h-4 w-4" />
            Nghe máy
          </Button>
        </div>
      </div>,
      document.body,
    );
  }

  const statusText =
    phase === 'outgoing'
      ? `Đang gọi ${state.peer.fullName}…`
      : phase === 'connecting'
        ? 'Đang kết nối…'
        : phase === 'active'
          ? isVideo
            ? `${elapsed} · ${state.peer.fullName} chưa bật camera`
            : elapsed
          : state.endedText;
  const showRemoteVideo = isVideo && phase === 'active' && remoteVideoLive;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${mediaLabel} với ${state.peer.fullName}`}
      className="fixed inset-0 z-[60] flex flex-col bg-foreground text-surface"
    >
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {isVideo && (
          <MediaView
            kind="video"
            stream={remoteStream}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              !showRemoteVideo && 'hidden',
            )}
          />
        )}
        {!isVideo && <MediaView kind="audio" stream={remoteStream} />}

        {!showRemoteVideo && (
          <div className="flex flex-col items-center px-6 text-center">
            <Avatar
              name={state.peer.fullName}
              src={state.peer.avatarUrl}
              size="xl"
              className={cn(
                (phase === 'outgoing' || phase === 'connecting') && 'motion-safe:animate-pulse',
              )}
            />
            <h2 className="mt-4 text-xl font-semibold">{state.peer.fullName}</h2>
            <p className="mt-1 text-sm text-surface/80" aria-live="polite">
              {statusText}
            </p>
          </div>
        )}

        {showRemoteVideo && (
          <div className="absolute left-4 top-4 rounded-lg bg-foreground/60 px-3 py-1.5 text-sm">
            <span className="font-semibold">{state.peer.fullName}</span>
            <span className="ml-2 tabular-nums text-surface/80">{elapsed}</span>
          </div>
        )}

        {isVideo && localStream && localStream.getVideoTracks().length > 0 && phase !== 'ended' && (
          <MediaView
            kind="video"
            stream={localStream}
            muted
            className={cn(
              'absolute bottom-4 right-4 aspect-[3/4] w-28 rounded-lg border border-surface/30 object-cover sm:w-40',
              !state.camOn && 'invisible',
            )}
          />
        )}
      </div>

      {state.localMediaMissing && phase !== 'ended' && (
        <p role="status" className="px-6 pb-2 text-center text-sm text-surface/80">
          Không truy cập được micro/camera — bạn vẫn nghe và xem được bên kia. Kiểm tra quyền thiết
          bị của trình duyệt.
        </p>
      )}

      {phase !== 'ended' && (
        <div className="flex items-center justify-center gap-4 pb-8 pt-4">
          {!state.localMediaMissing && (
            <ControlButton
              icon={state.micOn ? 'mic' : 'mic-off'}
              label={state.micOn ? 'Tắt micro' : 'Bật micro'}
              active={state.micOn}
              onClick={call.toggleMic}
            />
          )}
          {isVideo && localStream && localStream.getVideoTracks().length > 0 && (
            <ControlButton
              icon={state.camOn ? 'video' : 'video-off'}
              label={state.camOn ? 'Tắt camera' : 'Bật camera'}
              active={state.camOn}
              onClick={call.toggleCam}
            />
          )}
          <button
            ref={primaryRef}
            type="button"
            onClick={call.hangUp}
            aria-label={phase === 'outgoing' ? 'Huỷ cuộc gọi' : 'Kết thúc cuộc gọi'}
            title={phase === 'outgoing' ? 'Huỷ cuộc gọi' : 'Kết thúc cuộc gọi'}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-primary-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
          >
            <Icon name="phone-off" className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
