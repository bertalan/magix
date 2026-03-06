import React from "react";
import { Artist } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  X,
  Instagram,
  Facebook,
  Music,
  Globe,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Youtube,
} from "lucide-react";

interface BandSheetProps {
  artist: Artist;
  onClose: () => void;
  /** Callback per aprire dettaglio evento */
  onEventClick?: (eventSlug: string) => void;
}

/**
 * BandSheet — Scheda band completa con tutte le info e lightbox gallery.
 * Overlay full-screen modale, stile coerente con ArtistDetail.
 */
const BandSheet: React.FC<BandSheetProps> = ({ artist, onClose, onEventClick }) => {
  const { t } = useLanguage();
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  // Tutte le immagini: main + gallery
  const allImages = React.useMemo(() => {
    const imgs: string[] = [];
    if (artist.image_url) imgs.push(artist.image_url);
    if (artist.gallery_images) imgs.push(...artist.gallery_images);
    return imgs;
  }, [artist.image_url, artist.gallery_images]);

  // Escape per chiudere
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxOpen) {
          setLightboxOpen(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, lightboxOpen]);

  // Navigazione lightbox con frecce
  React.useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i + 1) % allImages.length);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxOpen, allImages.length]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  /** Mappa artist_type alla label tradotta */
  const typeLabel =
    t(`bandSheet.${artist.artist_type}`) || artist.artist_type?.replace("_", " ");

  /** Località composta */
  const locationParts = [artist.base_city, artist.base_region, artist.base_country].filter(Boolean);
  const location = locationParts.join(", ");

  return (
    <>
      {/* Overlay principale */}
      <div
        ref={sheetRef}
        className="fixed inset-0 z-[60] bg-[var(--bg-color)] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={`${t("bandSheet.title")} — ${artist.title}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="fixed top-24 right-5 landscape:top-6 landscape:right-5 md:top-8 md:right-8 z-[70] w-12 h-12 rounded-full glass-panel border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-main)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 transition-all"
          aria-label={t("bandSheet.close")}
        >
          <X size={20} />
        </button>

        <div className="max-w-4xl mx-auto px-6 py-12 md:px-12 md:py-16">
          {/* Header */}
          <div className="mb-12">
            <span className="text-[var(--accent)] font-bold tracking-[0.4em] text-sm mb-4 block uppercase">
              {t("bandSheet.title")}
            </span>
            <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tighter mb-4 text-[var(--text-main)]">
              {artist.title}
            </h1>
            {artist.tribute_to && (
              <p className="text-xl text-[var(--accent)] font-medium">
                {t("bandSheet.tributeTo")}: {artist.tribute_to}
              </p>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {/* Tipologia */}
            <div className="glass-panel rounded-2xl border border-[var(--glass-border)] p-6">
              <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] mb-2 uppercase">
                {t("bandSheet.type")}
              </h3>
              <p className="text-lg font-bold text-[var(--text-main)]">
                {typeLabel}
              </p>
            </div>

            {/* Genere */}
            <div className="glass-panel rounded-2xl border border-[var(--glass-border)] p-6">
              <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] mb-2 uppercase">
                {t("bandSheet.genre")}
              </h3>
              <p className="text-lg font-bold text-[var(--text-main)]">
                {artist.genre_display || "—"}
              </p>
            </div>

            {/* Località */}
            {location && (
              <div className="glass-panel rounded-2xl border border-[var(--glass-border)] p-6">
                <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] mb-2 uppercase">
                  {t("bandSheet.location")}
                </h3>
                <p className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                  <MapPin size={18} className="text-[var(--accent)]" />
                  {location}
                </p>
              </div>
            )}

            {/* Social & Links */}
            <div className="glass-panel rounded-2xl border border-[var(--glass-border)] p-6">
              <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] mb-2 uppercase">
                {t("bandSheet.socialLinks")}
              </h3>
              <div className="flex flex-wrap gap-3">
                {artist.socials?.instagram && (
                  <a
                    href={artist.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all text-sm font-medium"
                  >
                    <Instagram size={16} /> Instagram
                  </a>
                )}
                {artist.socials?.facebook && (
                  <a
                    href={artist.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all text-sm font-medium"
                  >
                    <Facebook size={16} /> Facebook
                  </a>
                )}
                {artist.socials?.spotify && (
                  <a
                    href={artist.socials.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all text-sm font-medium"
                  >
                    <Music size={16} /> Spotify
                  </a>
                )}
                {artist.socials?.website && (
                  <a
                    href={artist.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all text-sm font-medium"
                  >
                    <Globe size={16} /> {t("bandSheet.website")}
                  </a>
                )}
                {!artist.socials?.instagram &&
                  !artist.socials?.facebook &&
                  !artist.socials?.spotify &&
                  !artist.socials?.website && (
                    <span className="text-[var(--text-muted)] text-sm">—</span>
                  )}
              </div>
            </div>
          </div>

          {/* Biografia (short_bio) */}
          {artist.short_bio && (
            <div className="mb-12">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                <div className="w-8 h-[2px] bg-[var(--accent)]" />
                {t("bandSheet.biography")}
              </h3>
              <p className="text-lg text-[var(--text-muted)] font-light leading-relaxed max-w-3xl">
                {artist.short_bio}
              </p>
            </div>
          )}

          {/* Contenuto pagina (StreamField body) */}
          {artist.body_html && (
            <div className="mb-12">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                <div className="w-8 h-[2px] bg-[var(--accent)]" />
                {t("bandSheet.pageContent")}
              </h3>
              <div
                className="prose prose-invert prose-lg max-w-none text-[var(--text-muted)]
                  [&_h2]:text-[var(--text-main)] [&_h2]:font-heading [&_h2]:font-extrabold
                  [&_h3]:text-[var(--text-main)] [&_h3]:font-heading
                  [&_a]:text-[var(--accent)] [&_a]:no-underline [&_a:hover]:underline
                  [&_strong]:text-[var(--text-main)]
                  [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--accent)] [&_blockquote]:pl-4 [&_blockquote]:italic
                  [&_.gallery]:grid [&_.gallery]:grid-cols-2 [&_.gallery]:sm:grid-cols-3 [&_.gallery]:gap-3
                  [&_.gallery_img]:rounded-xl [&_.gallery_img]:border [&_.gallery_img]:border-[var(--glass-border)]
                  [&_.video-embed]:rounded-xl [&_.video-embed]:overflow-hidden
                  [&_.discography]:space-y-2
                  [&_.album]:flex [&_.album]:items-center [&_.album]:gap-3"
                dangerouslySetInnerHTML={{ __html: artist.body_html }}
              />
            </div>
          )}

          {/* Video Promo */}
          {artist.hero_video_url && (
            <div className="mb-12">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                <div className="w-8 h-[2px] bg-[var(--accent)]" />
                {t("bandSheet.heroVideo")}
              </h3>
              <a
                href={artist.hero_video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl glass-panel border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-all group"
              >
                <Youtube size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm">{t("bandSheet.watchVideo")}</span>
              </a>
            </div>
          )}

          {/* Prossimi eventi */}
          {artist.events && artist.events.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-main)]">
                <div className="w-8 h-[2px] bg-[var(--accent)]" />
                {t("bandSheet.upcomingEvents")}
              </h3>
              <div className="flex flex-col gap-3">
                {artist.events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event.slug)}
                    role={onEventClick ? "button" : undefined}
                    tabIndex={onEventClick ? 0 : undefined}
                    onKeyDown={(e) => e.key === "Enter" && onEventClick?.(event.slug)}
                    className={`glass-panel p-4 rounded-2xl border border-[var(--glass-border)] flex items-center gap-4 ${
                      onEventClick ? "cursor-pointer hover:border-[var(--accent)]/30 transition-all" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center min-w-[56px] h-[56px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-center">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase leading-none mb-0.5">
                        {new Date(event.date).toLocaleDateString("it-IT", { month: "short" })}
                      </span>
                      <span className="text-xl font-black text-[var(--text-main)] leading-none">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-[var(--text-main)] truncate">
                        {event.venue}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-sm">
                        <MapPin size={12} className="text-[var(--accent)]/60 flex-shrink-0" />
                        {event.city}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black tracking-[0.15em] px-2 py-1 rounded border ${
                        event.status === "FREE" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" :
                        event.status === "SOLD OUT" ? "text-rose-500 border-rose-500/30 bg-rose-500/5" :
                        event.status === "CANCELLED" ? "text-gray-500 border-gray-500/30 bg-gray-500/5" :
                        "text-[var(--accent)] border-[var(--glass-border)] bg-[var(--accent)]/5"
                      }`}>
                        {event.status === "FREE" ? "INGRESSO LIBERO" :
                         event.status === "SOLD OUT" ? "SOLD OUT" :
                         event.status === "CANCELLED" ? "ANNULLATO" :
                         event.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {allImages.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-main)]">
                <div className="w-8 h-[2px] bg-[var(--accent)]" />
                {t("bandSheet.gallery")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => openLightbox(i)}
                    className="aspect-[3/4] rounded-xl overflow-hidden border border-[var(--glass-border)] hover:border-[var(--accent)]/50 transition-all group cursor-pointer"
                  >
                    <img
                      src={img}
                      alt={`${artist.title} — ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {artist.tags && artist.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {artist.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-muted)] text-xs font-bold tracking-wider uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${artist.title} — ${t("bandSheet.gallery")}`}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
            aria-label={t("bandSheet.close")}
          >
            <X size={24} />
          </button>

          {/* Previous */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(
                  (i) => (i - 1 + allImages.length) % allImages.length
                );
              }}
              className="absolute left-2 md:left-8 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
              aria-label="Precedente"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Image */}
          <img
            src={allImages[lightboxIndex]}
            alt={`${artist.title} — ${lightboxIndex + 1}/${allImages.length}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i + 1) % allImages.length);
              }}
              className="absolute right-2 md:right-8 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
              aria-label="Successiva"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
            {lightboxIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </>
  );
};

export default BandSheet;
