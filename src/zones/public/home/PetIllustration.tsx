import { useEffect, useRef, useState } from 'react';
import { cloudinaryImage } from '@/utils/cloudinary-assets';

/** Movement comes from real footage, never from transforming a still image. */
export function PetIllustration() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const synchronize = () => {
      if (preference.matches) video.pause();
      else void video.play().catch(() => setPlaying(false));
    };
    synchronize();
    preference.addEventListener('change', synchronize);
    return () => preference.removeEventListener('change', synchronize);
  }, []);

  return (
    <figure className="pet-film">
      <video ref={videoRef} className="pet-film-video" src="/videos/pet-companion.mp4"
        poster={cloudinaryImage('images/pet-companion-poster.jpg')} muted loop playsInline preload="metadata"
        aria-label="Mèo chơi đùa cùng chủ"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onError={() => { setFailed(true); setPlaying(false); }} />
      <div className="pet-film-top"><span>NHỮNG KHOẢNH KHẮC BÊN NHAU</span><span aria-hidden="true">♡</span></div>
      <figcaption className="pet-film-caption">
        <span>Một người bạn nhỏ.</span>
        <strong>Cả một thế giới yêu thương.</strong>
        {!failed && <button type="button" aria-label={playing ? 'Tạm dừng video thú cưng' : 'Phát video thú cưng'} onClick={() => {
          const video = videoRef.current;
          if (!video) return;
          if (video.paused) void video.play().catch(() => setPlaying(false));
          else video.pause();
        }}><span aria-hidden="true">{playing ? 'Ⅱ' : '▷'}</span> {playing ? 'Tạm dừng' : 'Phát video'}</button>}
      </figcaption>
      <span className="pet-film-stamp" aria-hidden="true">WITH LOVE<br /><b>v.</b><br />VETAI HUB</span>
    </figure>
  );
}
