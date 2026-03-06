import React from "react";
import { Artist, ViewState } from "@/types";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useImageRotator, ImagePair } from "@/hooks/useImageRotator";
import ProgressiveImage from "./ProgressiveImage";
import VideoModal from "./VideoModal";
import BandSheet from "./BandSheet";
import SEOHead from "./SEOHead";
import { ArtistJsonLd } from "./JsonLdScript";
import { useLanguage } from "@/contexts/LanguageContext";
import { localePath } from "@/lib/routes";
import {
  X,
  Instagram,
  Facebook,
  Music,
  Play,
  Volume2,
  MapPin,
  Ticket,
  Youtube,
  FileText,
  Newspaper,
} from "lucide-react";

interface ArtistDetailProps {
  artist: Artist;
  onClose: () => void;
  setView?: (v: ViewState) => void;
  /** Callback per navigare a Booking con artista preselezionato */
  onBookArtist?: (artistName: string) => void;
  /** Callback per aprire il dettaglio evento (fetch + overlay) */
  onEventClick?: (eventSlug: string) => void;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({
  artist,
  onClose,
  setView,
  onBookArtist,
  onEventClick,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [showVideoModal, setShowVideoModal] = React.useState(false);
  const [showBandSheet, setShowBandSheet] = React.useState(false);
  const eventsRef = React.useRef<HTMLDivElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>();
  const { lang, t } = useLanguage();

  // SEO: aggiorna meta tag e JSON-LD per l'artista corrente
  const seoDescription = artist.short_bio?.slice(0, 160) || `${artist.title} — artista Magix Promotion`;

  // Costruisci array immagini paired: full-res + LQIP thumb
  const allImages = React.useMemo<ImagePair[]>(() => {
    const pairs: ImagePair[] = [];
    if (artist.image_url) {
      pairs.push({
        src: artist.image_url,
        thumb: artist.image_thumb ?? artist.image_url,
      });
    }
    if (artist.gallery_images) {
      artist.gallery_images.forEach((img, i) => {
        pairs.push({
          src: img,
          thumb: artist.gallery_thumbs?.[i] ?? img,
        });
      });
    }
    return pairs;
  }, [artist.image_url, artist.image_thumb, artist.gallery_images, artist.gallery_thumbs]);

  const { currentSrc, currentThumb, prevSrc, transitioning } = useImageRotator(allImages);

  // Close on Escape key
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Non chiudere il detail se un modal secondario è aperto
      if (e.key === "Escape" && !showVideoModal && !showBandSheet) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, showVideoModal]);

  const handlePlayClick = () => {
    if (artist.hero_video_url) {
      setShowVideoModal(true);
    }
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  const handleBooking = () => {
    if (onBookArtist) {
      onBookArtist(artist.title);
    } else {
      onClose();
      if (setView) {
        setView("BOOKING");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SOLD OUT":
      case "sold_out":
        return "text-rose-500 border-rose-500/30 bg-rose-500/5";
      case "cancelled":
        return "text-gray-500 border-gray-500/30 bg-gray-500/5";
      case "FREE":
        return "text-emerald-500 border-emerald-500/30 bg-emerald-500/5";
      default:
        return "text-[var(--accent)] border-[var(--glass-border)] bg-[var(--accent)]/5";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "FREE":
        return "INGRESSO LIBERO";
      case "SOLD OUT":
      case "sold_out":
        return "SOLD OUT";
      case "cancelled":
        return "ANNULLATO";
      default:
        return status.toUpperCase();
    }
  };

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[60] overflow-y-auto bg-[var(--bg-color)] animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={`Profilo artista: ${artist.title}`}
    >
      <SEOHead
        title={artist.title}
        description={seoDescription}
        image={artist.image_url || undefined}
        url={localePath(lang, "artists", artist.meta.slug)}
        type="music.musician"
      />
      <ArtistJsonLd artist={artist} lang={lang} />

      {/* Notifica riproduzione */}
      {isPlaying && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-top-8 duration-500">
          <div className="glass-panel px-8 py-4 rounded-full border border-[var(--accent)]/30 flex items-center gap-4 shadow-xl">
            <Volume2 className="text-[var(--accent)] animate-pulse" />
            <span className="font-bold tracking-tight text-[var(--text-main)]">
              Video promo di{" "}
              <span className="text-[var(--accent)]">{artist.title}</span>
            </span>
          </div>
        </div>
      )}

      {/* Close — spostato sotto l'header (80px) su mobile portrait, posizione normale in landscape/desktop */}
      <button
        onClick={onClose}
        className="fixed top-24 right-5 landscape:top-6 landscape:right-5 md:top-8 md:right-8 z-[70] p-4 glass-panel rounded-full text-[var(--text-main)] hover:bg-[var(--glass)] transition-colors"
        aria-label="Chiudi profilo artista"
      >
        <X size={28} className="md:w-8 md:h-8" />
      </button>

      <div className="flex flex-col landscape:flex-row lg:flex-row min-h-screen">
        {/* Lato sinistro: Immagine — 75vh portrait, full-screen in landscape e desktop */}
        <div className="relative h-[75vh] landscape:w-1/2 landscape:h-screen landscape:sticky landscape:top-0 lg:w-1/2 lg:h-screen lg:sticky lg:top-0 overflow-hidden">
          {currentSrc ? (
            <>
              {/* Immagine precedente (in uscita) */}
              {prevSrc && transitioning && (
                <img
                  src={prevSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover brightness-75 transition-opacity duration-[600ms] opacity-0"
                />
              )}
              {/* Immagine corrente con caricamento progressivo */}
              <ProgressiveImage
                src={currentSrc}
                placeholder={currentThumb}
                alt={artist.title}
                className={`md:grayscale brightness-90 md:brightness-75 lg:brightness-100 ${
                  transitioning ? "animate-fade-in" : ""
                }`}
                loading="eager"
              />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--glass)] to-[var(--bg-color)]" aria-hidden="true" />
          )}
          {/* Gradiente laterale (landscape + desktop) */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg-color)] hidden landscape:block lg:block" />
          {/* Gradiente dal basso (solo portrait mobile) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] to-transparent block landscape:hidden lg:hidden" />
        </div>

        {/* Lato destro: Contenuto — scrollabile in landscape */}
        <div className="landscape:w-1/2 landscape:overflow-y-auto landscape:h-screen lg:w-1/2 px-6 py-12 landscape:py-8 landscape:px-8 lg:p-24 flex flex-col">
          <div className="animate-in slide-in-from-right-12 duration-700">
            {/* Tipo artista */}
            <span className="text-[var(--accent)] font-bold tracking-[0.4em] text-sm mb-6 block uppercase">
              {artist.artist_type?.replace("_", " ") || "Artista"}
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-9xl font-heading font-extrabold tracking-tighter mb-6 md:mb-8 leading-none text-[var(--text-main)]">
              {artist.title}
            </h1>

            {/* Genere + Social */}
            <div className="flex flex-wrap gap-4 mb-12">
              <span className="px-6 py-3 glass-panel rounded-full border border-[var(--glass-border)] text-[var(--text-muted)] font-bold text-sm">
                {artist.genre_display}
              </span>
              <div className="flex gap-4 items-center">
                {artist.socials?.instagram && (
                  <a
                    href={artist.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram size={24} />
                  </a>
                )}
                {artist.socials?.facebook && (
                  <a
                    href={artist.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook size={24} />
                  </a>
                )}
                {artist.socials?.spotify && (
                  <a
                    href={artist.socials.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    aria-label="Spotify"
                  >
                    <Music size={24} />
                  </a>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="max-w-xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                <div className="w-8 h-[2px] bg-[var(--accent)]" />
                BIOGRAFIA
              </h3>
              <p className="text-lg lg:text-2xl text-[var(--text-muted)] font-light leading-relaxed mb-12">
                {artist.short_bio}
              </p>
            </div>

            {/* Action cards — griglia 2×2 */}
            <div className="grid grid-cols-1 landscape:grid-cols-2 sm:grid-cols-2 gap-4 landscape:gap-4 sm:gap-6 mb-16">
              {/* 1. Video Promo */}
              <div
                onClick={handlePlayClick}
                className="p-5 landscape:p-4 sm:p-8 glass-panel rounded-3xl border border-[var(--glass-border)] flex flex-col gap-3 group cursor-pointer hover:border-[var(--accent)]/30 transition-all active:scale-95"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handlePlayClick()}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--bg-color)] group-hover:scale-110 transition-transform shadow-lg">
                  {artist.hero_video_url ? (
                    <Youtube size={20} />
                  ) : (
                    <Play fill="currentColor" size={20} />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xl uppercase text-[var(--text-main)]">
                    {t("artistDetail.videoPromo")}
                  </h4>
                  <p className="text-[var(--text-muted)] text-sm">
                    {artist.hero_video_url
                      ? t("artistDetail.watchYoutube")
                      : t("artistDetail.videoNotAvailable")}
                  </p>
                </div>
              </div>

              {/* 2. Date Live */}
              <div
                onClick={() =>
                  eventsRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                className="p-5 landscape:p-4 sm:p-8 glass-panel rounded-3xl border border-[var(--glass-border)] flex flex-col gap-3 group cursor-pointer hover:border-[var(--accent-secondary)]/30 transition-all active:scale-95"
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  eventsRef.current?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <div className="w-12 h-12 rounded-full bg-[var(--accent-secondary)] flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                  <Music size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xl uppercase text-[var(--text-main)]">
                    {t("artistDetail.dateLive")}
                  </h4>
                  <p className="text-[var(--text-muted)] text-sm">
                    {t("artistDetail.eventsCount", { count: artist.events?.length || 0 })}
                  </p>
                </div>
              </div>

              {/* 3. Scheda Band */}
              <div
                onClick={() => setShowBandSheet(true)}
                className="p-5 landscape:p-4 sm:p-8 glass-panel rounded-3xl border border-[var(--glass-border)] flex flex-col gap-3 group cursor-pointer hover:border-emerald-500/30 transition-all active:scale-95"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setShowBandSheet(true)}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xl uppercase text-[var(--text-main)]">
                    {t("artistDetail.bandSheet")}
                  </h4>
                  <p className="text-[var(--text-muted)] text-sm">
                    {t("artistDetail.bandSheetDesc")}
                  </p>
                </div>
              </div>

              {/* 4. Press Kit EPK — visibile solo se EPK disponibile */}
              {artist.epk && (
                <div
                  onClick={() => setView?.("PRESS")}
                  className="p-5 landscape:p-4 sm:p-8 glass-panel rounded-3xl border border-[var(--glass-border)] flex flex-col gap-3 group cursor-pointer hover:border-purple-500/30 transition-all active:scale-95"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setView?.("PRESS")}
                >
                  <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                    <Newspaper size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl uppercase text-[var(--text-main)]">
                      {t("artistDetail.pressKit")}
                    </h4>
                    <p className="text-[var(--text-muted)] text-sm">
                      {t("artistDetail.pressKitDesc")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Eventi */}
            <div ref={eventsRef} className="pt-12 mb-16 scroll-mt-24">
              <h3 className="text-3xl font-heading font-extrabold mb-10 flex items-center gap-4 text-[var(--text-main)]">
                <span className="text-[var(--accent)]">/</span> {t("artistDetail.upcomingEvents")}
              </h3>
              <div className="flex flex-col gap-4">
                {(artist.events || []).length > 0 ? (
                  artist.events.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event.slug)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && onEventClick?.(event.slug)}
                      className="glass-panel group p-6 rounded-2xl border border-[var(--glass-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--glass)] hover:border-[var(--accent)]/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-center">
                          <span className="text-xs font-bold text-[var(--text-muted)] uppercase leading-none mb-1">
                            {new Date(event.date).toLocaleDateString("it-IT", {
                              month: "short",
                            })}
                          </span>
                          <span className="text-2xl font-black text-[var(--text-main)] leading-none">
                            {new Date(event.date).getDate()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-[var(--text-main)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                            {event.venue}
                          </h4>
                          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
                            <MapPin
                              size={14}
                              className="text-[var(--accent)]/60"
                            />
                            {event.city}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div
                          className={`text-[10px] font-black tracking-[0.2em] px-3 py-1.5 rounded border ${getStatusColor(event.status)}`}
                        >
                          {getStatusLabel(event.status)}
                        </div>
                        <button
                          className="p-3 rounded-full bg-[var(--text-main)] text-[var(--bg-color)] hover:scale-110 transition-transform transform group-hover:bg-[var(--accent)]"
                          aria-label="Biglietti"
                        >
                          <Ticket size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--text-muted)] italic">
                    {t("artistDetail.noEvents")}
                  </p>
                )}
              </div>
            </div>

            {/* CTA Booking */}
            <button
              onClick={handleBooking}
              className="w-full px-12 py-6 bg-[var(--text-main)] text-[var(--bg-color)] font-black tracking-widest hover:scale-[1.02] transition-all rounded-full text-lg shadow-xl shadow-[var(--accent)]/10"
            >
              {t("artistDetail.requestQuote")}
            </button>
          </div>
        </div>
      </div>

      {/* Video Modal overlay */}
      {showVideoModal && artist.hero_video_url && (
        <VideoModal
          videoUrl={artist.hero_video_url}
          artistName={artist.title}
          onClose={() => setShowVideoModal(false)}
        />
      )}

      {/* Band Sheet modal overlay */}
      {showBandSheet && (
        <BandSheet
          artist={artist}
          onClose={() => setShowBandSheet(false)}
        />
      )}
    </div>
  );
};

export default ArtistDetail;
