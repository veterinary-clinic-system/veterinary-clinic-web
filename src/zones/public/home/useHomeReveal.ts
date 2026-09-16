import { useEffect, useRef } from 'react';

export function useHomeReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (
      !root ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('pet-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08 },
    );
    const observeSections = () => {
      root
        .querySelectorAll('section:not(.pet-hero):not(.garden-hero):not(.pet-reveal)')
        .forEach((section) => {
          section.classList.add('pet-reveal');
          observer.observe(section);
        });
    };
    observeSections();
    const mutation = new MutationObserver(observeSections);
    mutation.observe(root, { childList: true, subtree: true });
    return () => {
      mutation.disconnect();
      observer.disconnect();
      root
        .querySelectorAll('.pet-reveal')
        .forEach((section) => section.classList.remove('pet-reveal', 'pet-visible'));
    };
  }, []);
  return ref;
}
