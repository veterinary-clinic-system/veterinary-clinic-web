import { useRef, useState, type PointerEvent } from 'react';

export function PetIllustration() {
  const [paused, setPaused] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const resetTilt = () => {
    sceneRef.current?.style.setProperty('--pet-rx', '0deg');
    sceneRef.current?.style.setProperty('--pet-ry', '0deg');
  };
  const moveScene = (event: PointerEvent<HTMLDivElement>) => {
    if (
      paused ||
      event.pointerType !== 'mouse' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    sceneRef.current?.style.setProperty(
      '--pet-rx',
      `${(-(event.clientY - bounds.top - bounds.height / 2) / bounds.height) * 10}deg`,
    );
    sceneRef.current?.style.setProperty(
      '--pet-ry',
      `${((event.clientX - bounds.left - bounds.width / 2) / bounds.width) * 14}deg`,
    );
  };
  return (
    <div
      ref={sceneRef}
      className={`pet-scene pet-scene-3d pet-photo-scene${paused ? 'pet-paused' : ''}`}
      onPointerMove={moveScene}
      onPointerLeave={resetTilt}
    >
      <div className="pet-world">
        <div className="pet-real-stage">
          <span className="pet-stage-glow" aria-hidden="true" />
          <img
            src="/images/golden-retriever-walking-v1.png"
            alt="Chó Golden Retriever đang bước đi"
            width="1254"
            height="1254"
            fetchPriority="high"
            className="pet-real-dog"
          />
          <img
            src="/images/british-shorthair-jumping-v1.png"
            alt="Mèo lông ngắn xám đang nhảy vui đùa"
            width="1254"
            height="1254"
            fetchPriority="high"
            className="pet-real-cat"
          />
          <span className="pet-photo-signature">
            Những người bạn nhỏ.
            <br />
            <strong>Một tình yêu thật lớn.</strong>
          </span>
        </div>
        <div className="pet-note pet-note-top">
          <span className="pet-note-icon">♡</span>
          <div>
            <strong>Chăm sóc bằng cả trái tim</strong>
            <small>Đồng hành cùng bé mỗi ngày</small>
          </div>
        </div>
        <div className="pet-note pet-note-bottom">
          <span className="pet-note-icon">✓</span>
          <div>
            <strong>Yêu thương, luôn được tiếp nối</strong>
            <small>Hồ sơ sức khỏe trong tầm tay</small>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="pet-motion-toggle"
        aria-pressed={paused}
        onClick={() => {
          resetTilt();
          setPaused(!paused);
        }}
      >
        {paused ? 'Bật chuyển động' : 'Tạm dừng chuyển động'}
      </button>
    </div>
  );
}
