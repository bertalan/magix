import React from "react";

interface OptimizedImageProps {
  renditions: {
    thumbnail?: string;
    card?: string;
    card_2x?: string;
    mobile?: string;
    desktop?: string;
    desktop_2x?: string;
    og?: string;
  };
  alt: string;
  className?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
}

/**
 * Componente immagine ottimizzata con srcSet responsive.
 *
 * Riceve un oggetto renditions dal backend Wagtail (WebP)
 * e genera un tag <img> con srcSet e sizes per il browser.
 *
 * Tutte le immagini usano loading="lazy" di default,
 * tranne le hero above-the-fold che devono usare loading="eager".
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  renditions,
  alt,
  className = "",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  loading = "lazy",
}) => {
  const srcSet = [
    renditions.thumbnail && `${renditions.thumbnail} 400w`,
    renditions.card && `${renditions.card} 600w`,
    renditions.card_2x && `${renditions.card_2x} 1200w`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <img
      src={renditions.card || renditions.thumbnail || ""}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
    />
  );
};

export default OptimizedImage;
