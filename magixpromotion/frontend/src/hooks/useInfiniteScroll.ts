import { useEffect, useRef, useCallback } from "react";

/**
 * Hook che osserva un elemento sentinella in fondo alla lista.
 * Quando l'elemento diventa visibile nel viewport, chiama `onLoadMore`.
 *
 * Rispetta prefers-reduced-motion: in quel caso usa un margine
 * di 400px per pre-caricare prima che l'utente arrivi in fondo.
 *
 * @returns ref da assegnare all'elemento sentinella (<div ref={sentinelRef} />)
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  /** Se true, non attiva il caricamento (es. già in loading o nessun dato rimanente) */
  disabled: boolean,
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onLoadMore);

  // Mantieni il callback aggiornato senza ricreare l'observer
  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting) {
        callbackRef.current();
      }
    },
    [],
  );

  useEffect(() => {
    if (disabled || !sentinelRef.current) return;

    // Pre-carica 300px prima del bordo visibile per UX fluida
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const rootMargin = prefersReducedMotion ? "400px" : "300px";

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: `0px 0px ${rootMargin} 0px`,
      threshold: 0,
    });

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [disabled, observerCallback]);

  return sentinelRef;
}
