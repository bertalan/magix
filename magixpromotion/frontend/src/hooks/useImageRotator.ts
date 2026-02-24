import { useState, useEffect, useCallback, useRef } from "react";

export interface ImagePair {
  src: string;
  thumb: string;
}

/**
 * Hook per ruotare ciclicamente tra una lista di immagini
 * con tempistiche casuali tra `minDelay` e `maxDelay` (ms).
 *
 * Accetta un array di `ImagePair` (full-res + LQIP thumb)
 * e restituisce URL correnti/precedenti per animare crossfade progressivo.
 */
export function useImageRotator(
  images: ImagePair[],
  { minDelay = 3000, maxDelay = 6000 } = {},
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const randomDelay = useCallback(
    () => Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay,
    [minDelay, maxDelay],
  );

  useEffect(() => {
    // Serve almeno 2 immagini per ruotare
    if (images.length < 2) return;

    const scheduleNext = () => {
      timerRef.current = setTimeout(() => {
        setPrevIndex(currentIndex);
        setTransitioning(true);

        // Dopo la transizione CSS (600ms) aggiorna l'indice effettivo
        setTimeout(() => {
          setCurrentIndex((i) => (i + 1) % images.length);
          setTransitioning(false);
          setPrevIndex(null);
          scheduleNext();
        }, 600);
      }, randomDelay());
    };

    scheduleNext();
    return () => {
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, randomDelay]);

  const current = images[currentIndex] ?? null;
  const prev = prevIndex !== null ? images[prevIndex] : null;

  return {
    /** URL dell'immagine full-res attualmente visibile */
    currentSrc: current?.src ?? null,
    /** URL del thumb LQIP dell'immagine corrente */
    currentThumb: current?.thumb ?? null,
    /** URL dell'immagine full-res che sta scomparendo */
    prevSrc: prev?.src ?? null,
    /** URL del thumb LQIP dell'immagine che sta scomparendo */
    prevThumb: prev?.thumb ?? null,
    /** true durante i 600ms di crossfade */
    transitioning,
    /** Indice corrente nell'array */
    index: currentIndex,
    /** Numero totale di immagini */
    total: images.length,
  };
}
