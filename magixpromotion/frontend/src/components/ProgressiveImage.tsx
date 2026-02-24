import React, { useState, useEffect, useRef, useCallback } from "react";

interface ProgressiveImageProps {
  /** URL immagine a piena risoluzione */
  src: string;
  /** URL thumbnail tiny LQIP (40×60 WebP) — mostrato sfocato in attesa del full */
  placeholder?: string | null;
  alt: string;
  className?: string;
  /** Classe CSS aggiuntiva applicata durante la fase di blur (placeholder) */
  blurClassName?: string;
  /** Durata transizione blur→sharp in ms */
  transitionMs?: number;
  /** Attributo loading nativo */
  loading?: "lazy" | "eager";
  /** Disabilita l'effetto progressivo (utile per reduced-motion) */
  disableProgressive?: boolean;
  ariaHidden?: boolean;
}

/**
 * Immagine con caricamento progressivo blur-up.
 *
 * Fasi:
 * 1. **Placeholder** — mostra il tiny thumb (40×60) scalato al 100%
 *    con `filter: blur(20px)`, appare istantaneamente (~1-2 KB).
 * 2. **Loading** — precarica l'immagine full-res in background.
 * 3. **Reveal** — fade-in da sfocato a nitido con transizione CSS.
 *
 * Se non c'è placeholder, mostra un gradiente shimmer animato.
 */
const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholder,
  alt,
  className = "",
  blurClassName = "",
  transitionMs = 700,
  loading = "lazy",
  disableProgressive = false,
  ariaHidden,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const prevSrcRef = useRef(src);

  // Reset loaded state when src changes
  useEffect(() => {
    if (src !== prevSrcRef.current) {
      setLoaded(false);
      setCurrentSrc(src);
      prevSrcRef.current = src;
    }
  }, [src]);

  // Preload full image
  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  // Se l'immagine è già in cache del browser, trigga subito
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [currentSrc]);

  // Se progressive è disabilitato, renderizza solo l'immagine diretta
  if (disableProgressive || !placeholder) {
    return (
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        aria-hidden={ariaHidden}
      />
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden" aria-hidden={ariaHidden}>
      {/* Layer 1: Placeholder LQIP (tiny, sfocato) — sempre visibile finché non caricata */}
      <img
        src={placeholder}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover scale-110 ${blurClassName} ${className}`}
        style={{
          filter: "blur(20px)",
          transition: `opacity ${transitionMs}ms ease-out`,
          opacity: loaded ? 0 : 1,
        }}
      />

      {/* Layer 2: Shimmer overlay durante il caricamento */}
      {!loaded && (
        <div
          className="absolute inset-0 animate-shimmer"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
          aria-hidden="true"
        />
      )}

      {/* Layer 3: Immagine full-res — carica in background, fade-in quando pronta */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
        style={{
          transition: `opacity ${transitionMs}ms ease-in-out`,
          opacity: loaded ? 1 : 0,
        }}
      />
    </div>
  );
};

export default ProgressiveImage;
