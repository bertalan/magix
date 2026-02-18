/**
 * VideoModal — Modal overlay per embed video YouTube / Dailymotion.
 *
 * Caratteristiche:
 * - Embed iframe privacy-enhanced (youtube-nocookie.com)
 * - Focus trap completo (useFocusTrap)
 * - Chiusura con Escape, click backdrop, pulsante X
 * - Rispetta prefers-reduced-motion
 * - Proporzioni 16:9 responsive
 * - Lazy loading iframe
 */
import React from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface VideoModalProps {
  /** URL del video (YouTube, Dailymotion, o embed diretto) */
  videoUrl: string;
  /** Titolo dell'artista, usato per aria-label */
  artistName: string;
  /** Callback per chiudere il modal */
  onClose: () => void;
}

/**
 * Estrae l'URL embed da un URL YouTube, Dailymotion o generico.
 * Restituisce null se non riconosciuto.
 */
function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube: youtube.com/watch?v=ID o youtu.be/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
  }

  // Dailymotion: dai.ly/ID o dailymotion.com/video/ID
  const dmMatch = url.match(
    /(?:dai\.ly\/|dailymotion\.com\/video\/)([a-zA-Z0-9]+)/
  );
  if (dmMatch) {
    return `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1`;
  }

  // Fallback: se è già un embed URL, restituiscilo
  if (url.includes("/embed/") || url.includes("player.")) {
    return url;
  }

  return null;
}

const VideoModal: React.FC<VideoModalProps> = ({
  videoUrl,
  artistName,
  onClose,
}) => {
  const trapRef = useFocusTrap<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const embedUrl = getEmbedUrl(videoUrl);

  // Chiusura con Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Blocca scroll del body quando il modal è aperto
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Gestione click sul backdrop (chiude se click è fuori dal contenuto)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const animationClass = reducedMotion
    ? ""
    : "animate-in fade-in zoom-in-95 duration-300";

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Video promo di ${artistName}`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/90 ${reducedMotion ? "" : "animate-in fade-in duration-200"}`}
        aria-hidden="true"
      />

      {/* Contenuto modal */}
      <div
        className={`relative w-full max-w-5xl ${animationClass}`}
      >
        {/* Pulsante chiusura */}
        <button
          onClick={onClose}
          className="absolute -top-14 right-0 sm:-top-4 sm:-right-14 z-10 p-3 rounded-full glass-panel border border-[var(--glass-border)] text-white hover:bg-white/10 transition-colors"
          aria-label="Chiudi video"
        >
          <X size={24} />
        </button>

        {/* Titolo artista */}
        <div className="mb-4">
          <h3 className="text-white text-xl font-heading font-bold tracking-tight">
            {artistName}
            <span className="text-[var(--accent)] ml-2 text-sm font-normal tracking-wide">
              VIDEO PROMO
            </span>
          </h3>
        </div>

        {/* Container video 16:9 */}
        {embedUrl ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/50 border border-white/10">
            <iframe
              src={embedUrl}
              title={`Video promo di ${artistName}`}
              className="absolute inset-0 w-full h-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center">
            <div className="text-center text-white/60">
              <p className="text-lg mb-2">Video non disponibile per l'embed</p>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline hover:no-underline"
              >
                Apri su YouTube
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoModal;

// Esporta la funzione helper per test
export { getEmbedUrl };
