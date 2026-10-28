import { useEffect, useState } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Máy cảm ứng, màn hẹp, ít nhân CPU hoặc bật tiết kiệm dữ liệu: nền 3D đứng yên mặc định
 * (vẫn vẽ một khung hình), người dùng tự bật lại bằng nút chuyển động nếu muốn.
 */
function isLightweightDevice(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.innerWidth < 768 ||
    (navigator.hardwareConcurrency ?? 8) <= 4 ||
    connection?.saveData === true
  );
}

export function useGardenMotion() {
  const [paused, setPaused] = useState(
    () => window.matchMedia(REDUCED_MOTION).matches || isLightweightDevice(),
  );
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const update = () => setPaused(query.matches || isLightweightDevice());
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return { paused, toggle: () => setPaused((value) => !value) };
}
