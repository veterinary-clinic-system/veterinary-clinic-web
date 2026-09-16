import { useEffect, useRef } from 'react';

export function GardenBackdrop({ paused }: { paused: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof import('./garden-scene').createGardenScene>>();
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    let cancelled = false;
    // Three.js is loaded only after the public layout mounts, never by staff routes.
    void import('./garden-scene')
      .then(({ createGardenScene }) => {
        if (cancelled || !host.current) return;
        try {
          scene.current = createGardenScene(host.current, pausedRef.current);
        } catch {
          /* The layered CSS garden remains visible without WebGL. */
        }
      })
      .catch(() => {
        /* Network failure must never block a booking form. */
      });
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = undefined;
    };
  }, []);

  useEffect(() => {
    scene.current?.setPaused(paused);
  }, [paused]);

  return (
    <div className="garden-backdrop" aria-hidden="true">
      <div className="garden-light garden-light-sun" />
      <div className="garden-light garden-light-mint" />
      <div className="garden-contour garden-contour-one" />
      <div className="garden-contour garden-contour-two" />
      <div ref={host} className="garden-webgl" />
      <div className="garden-grain" />
    </div>
  );
}
