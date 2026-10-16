import { useEffect } from 'react';

/**
 * Chuông cuộc gọi dựng bằng Web Audio (không cần tệp âm thanh). Trình duyệt có thể chặn
 * âm thanh trước khi người dùng tương tác với trang - khi đó chỉ còn thẻ cuộc gọi đến,
 * không có lỗi nào.
 */
export function useRingtone(kind: 'incoming' | 'outgoing' | null) {
  useEffect(() => {
    if (!kind) return undefined;
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return undefined;

    let ctx: AudioContext;
    try {
      ctx = new AudioCtx();
    } catch {
      return undefined;
    }

    const beep = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = kind === 'incoming' ? 660 : 440;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1);
      } catch {
        /* bị chặn tự phát âm thanh */
      }
    };

    beep();
    const timer = window.setInterval(beep, kind === 'incoming' ? 2000 : 3000);
    return () => {
      window.clearInterval(timer);
      void ctx.close().catch(() => undefined);
    };
  }, [kind]);
}
