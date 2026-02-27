/**
 * VideoModal — Modal overlay con lite YouTube embed.
 *
 * Approccio "thumbnail-first":
 * 1. Mostra il thumbnail YouTube (immagine statica, nessun JS esterno)
 * 2. Al click dell'utente carica l'iframe embed (autoplay dopo interazione)
 * 3. Elimina crash dovuto ad autoplay senza interazione utente
 *
 * Caratteristiche:
 * - Lite embed: thumbnail → iframe solo al click (performance + stabilità)
 * - Privacy-enhanced embed (youtube-nocookie.com)
 * - Focus trap completo (useFocusTrap)
 * - Chiusura con Escape, click backdrop, pulsante X
 * - Rispetta prefers-reduced-motion
 * - Proporzioni 16:9 responsive
 * - Fallback per Dailymotion e URL generici
 */
import React from "react";
import { X, Play } from "lucide-react";
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

/** Informazioni estratte da un URL video */
interface VideoInfo {
  /** URL embed per l'iframe */
  embedUrl: string;
  /** URL thumbnail (solo YouTube) */
  thumbnailUrl: string | null;
  /** Provider del video */
  provider: "youtube" | "dailymotion" | "generic";
}

/**
 * Estrae l'URL embed da un URL YouTube, Dailymotion o generico.
 * Restituisce null se non riconosciuto.
 */
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const info = parseVideoUrl(url);
  return info?.embedUrl ?? null;
}

/**
 * Analizza un URL video e restituisce embed URL + thumbnail.
 */
function parseVideoUrl(url: string): VideoInfo | null {
  if (!url) return null;

  // YouTube: youtube.com/watch?v=ID o youtu.be/ID o youtube-nocookie.com/embed/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      provider: "youtube",
    };
  }

  // Dailymotion: dai.ly/ID o dailymotion.com/video/ID
  const dmMatch = url.match(
    /(?:dai\.ly\/|dailymotion\.com\/video\/)([a-zA-Z0-9]+)/
  );
  if (dmMatch) {
    return {
      embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1`,
      thumbnailUrl: null,
      provider: "dailymotion",
    };
  }

  // Fallback: se è già un embed URL, restituiscilo
  if (url.includes("/embed/") || url.includes("player.")) {
    return {
      embedUrl: url,
      thumbnailUrl: null,
      provider: "generic",
    };
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
  const videoInfo = parseVideoUrl(videoUrl);
  /** Stato: false = mostra thumbnail, true = carica iframe */
  const [activated, setActivated] = React.useState(false);
  /** Gestisce errore caricamento thumbnail */
  const [thumbError, setThumbError] = React.useState(false);

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

  /** Attiva il player: carica l'iframe con autoplay */
  const handleActivate = () => {
    setActivated(true);
  };

  const animationClass = reducedMotion
    ? ""
    : "animate-in fade-in zoom-in-95 duration-300";

  /** Thumbnail YouTube con fallback (maxresdefault → hqdefault) */
  const thumbnailSrc = React.useMemo(() => {
    if (!videoInfo?.thumbnailUrl || thumbError) {
      // Fallback a hqdefault (sempre disponibile)
      const ytMatch = videoUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/
      );
      if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      return null;
    }
    return videoInfo.thumbnailUrl;
  }, [videoInfo?.thumbnailUrl, thumbError, videoUrl]);

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
        {videoInfo ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/50 border border-white/10">
            {activated ? (
              /* Iframe caricato dopo il click dell'utente — autoplay funziona */
              <iframe
                src={videoInfo.embedUrl}
                title={`Video promo di ${artistName}`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
                allowFullScreen
                referrerPolicy="no-referrer"
              />
            ) : (
              /* Lite embed: thumbnail cliccabile (nessun JS YouTube caricato) */
              <button
                onClick={handleActivate}
                className="absolute inset-0 w-full h-full group cursor-pointer bg-black"
                aria-label={`Avvia video promo di ${artistName}`}
              >
                {/* Thumbnail */}
                {thumbnailSrc && (
                  <img
                    src={thumbnailSrc}
                    alt={`Anteprima video ${artistName}`}
                    className="absolute inset-0 w-full h-full object-cover group-hover:brightness-75 transition-all duration-300"
                    onError={() => setThumbError(true)}
                    loading="eager"
                  />
                )}
                {/* Overlay scuro */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300" />
                {/* Play button centrale */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <Play
                      fill="currentColor"
                      size={36}
                      className="text-[var(--bg-color)] ml-1"
                    />
                  </div>
                </div>
                {/* Label provider */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-black/60 text-white/80 text-xs font-medium tracking-wide backdrop-blur-sm">
                  {videoInfo.provider === "youtube" && "YouTube"}
                  {videoInfo.provider === "dailymotion" && "Dailymotion"}
                  {videoInfo.provider === "generic" && "Video"}
                </div>
              </button>
            )}
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

// Esporta le funzioni helper per test
export { getEmbedUrl, parseVideoUrl };
export type { VideoInfo };
