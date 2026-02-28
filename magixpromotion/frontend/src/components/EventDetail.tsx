/**
 * EventDetail — Pagina dettaglio evento full-screen overlay.
 *
 * Stessa UI/UX di ArtistDetail:
 * - Layout split: immagine (sx) + contenuto (dx)
 * - Focus trap per accessibilità
 * - Chiusura con Escape o pulsante X
 * - Glassmorphism + CSS custom properties
 * - Responsive: stack verticale su mobile, affiancato su desktop
 */
import React from "react";
import type { EventPage, ViewState } from "@/types";
import { fetchEvents } from "@/lib/api";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useImageRotator, ImagePair } from "@/hooks/useImageRotator";
import { useLanguage } from "@/contexts/LanguageContext";
import { localePath } from "@/lib/routes";
import ProgressiveImage from "./ProgressiveImage";
import SEOHead from "./SEOHead";
import { EventJsonLd } from "./JsonLdScript";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Music,
  Ticket,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface EventDetailProps {
  event: EventPage;
  onClose: () => void;
  onArtistClick?: (artistId: number) => void;
  onEventClick?: (event: EventPage) => void;
  onBookArtist?: (artistName: string) => void;
  setView?: (v: ViewState) => void;
}

/**
 * Converte un URL YouTube/Dailymotion in URL embed privacy-enhanced.
 */
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  }
  const dmMatch = url.match(
    /(?:dai\.ly\/|dailymotion\.com\/video\/)([a-zA-Z0-9]+)/
  );
  if (dmMatch) {
    return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`;
  }
  return null;
}

/**
 * Processa l'HTML della descrizione Wagtail:
 * - Estrae i tag <embed embedtype="media" url="..."/> 
 * - Li sostituisce con iframe responsivi per YouTube/Dailymotion
 */
function processDescription(html: string): string {
  return html.replace(
    /<embed\s+[^>]*embedtype="media"[^>]*url="([^"]+)"[^>]*\/?>\s*/gi,
    (_match, url: string) => {
      const embedUrl = getEmbedUrl(url);
      if (!embedUrl) return "";
      return `<div class="relative w-full my-8" style="padding-bottom:56.25%"><iframe src="${embedUrl}" class="absolute inset-0 w-full h-full rounded-2xl" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="Video"></iframe></div>`;
    }
  );
}

/** Colore badge in base allo status */
const getStatusColor = (status: EventPage["status"]): string => {
  switch (status) {
    case "sold_out":
      return "text-rose-500 border-rose-500/30 bg-rose-500/5";
    case "cancelled":
      return "text-neutral-400 border-neutral-400/30 bg-neutral-400/5";
    case "postponed":
      return "text-amber-500 border-amber-500/30 bg-amber-500/5";
    case "tentative":
      return "text-sky-400 border-sky-400/30 bg-sky-400/5";
    case "confirmed":
    default:
      return "text-[var(--accent)] border-[var(--accent)]/30 bg-[var(--accent)]/5";
  }
};

/** Label italiano dello status */
const getStatusLabel = (status: EventPage["status"]): string => {
  switch (status) {
    case "sold_out":
      return "SOLD OUT";
    case "cancelled":
      return "ANNULLATO";
    case "postponed":
      return "RINVIATO";
    case "tentative":
      return "DA CONFERMARE";
    case "confirmed":
    default:
      return "DISPONIBILE";
  }
};

const EventDetail: React.FC<EventDetailProps> = ({
  event,
  onClose,
  onArtistClick,
  onEventClick,
  onBookArtist,
  setView,
}) => {
  const trapRef = useFocusTrap<HTMLDivElement>();
  const [relatedEvents, setRelatedEvents] = React.useState<EventPage[]>([]);
  const { lang } = useLanguage();

  // Costruisci array immagini artista per rotazione fallback (quando evento senza foto)
  const artistImages = React.useMemo<ImagePair[]>(() => {
    if (event.featured_image_url) return []; // non serve: l'evento ha una sua foto
    const artist = event.artist;
    if (!artist) return [];
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
  }, [event.featured_image_url, event.artist]);

  const { currentSrc, currentThumb, prevSrc, transitioning } = useImageRotator(artistImages);

  // Chiusura con Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Fetch altri eventi dello stesso artista
  React.useEffect(() => {
    if (!event.artist?.slug) return;
    const today = new Date().toISOString().split("T")[0];
    fetchEvents({
      artist: event.artist.slug,
      date_from: today,
      limit: 6,
      locale: lang,
    }).then((res) => {
      // Escludi l'evento corrente
      setRelatedEvents(res.items.filter((e) => e.id !== event.id));
    }).catch(() => {
      // Ignora errori — sezione opzionale
    });
  }, [event.id, event.artist?.slug]);

  const date = new Date(event.start_date);
  const formattedDate = date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const venueName = event.venue?.name ?? "";
  const city = event.venue?.city ?? "";
  const region = event.venue?.region ?? "";
  const country = event.venue?.country ?? "";
  const lat = event.venue?.latitude ?? null;
  const lng = event.venue?.longitude ?? null;

  const mapsUrl = lat && lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueName}, ${city}`)}`;

  const handleBooking = () => {
    const artistName = event.artist?.name || event.title;
    if (onBookArtist) {
      onBookArtist(artistName);
    } else {
      onClose();
      if (setView) setView("BOOKING");
    }
  };

  const seoTitle = event.title;
  const seoDescription = event.venue
    ? `${event.title} @ ${event.venue.name}, ${event.venue.city}${event.start_date ? ` — ${event.start_date}` : ""}`
    : event.title;

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[60] overflow-y-auto bg-[var(--bg-color)] animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={`Dettaglio evento: ${event.title}`}
    >
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        image={event.featured_image_url || undefined}
        url={localePath(lang, "events", event.meta.slug)}
        type="music.event"
      />
      <EventJsonLd event={event} lang={lang} />

      {/* Close */}
      <button
        onClick={onClose}
        className="fixed top-8 right-8 z-[70] p-4 glass-panel rounded-full text-[var(--text-main)] hover:bg-[var(--glass)] transition-colors"
        aria-label="Chiudi dettaglio evento"
      >
        <X size={32} />
      </button>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Lato sinistro: Immagine */}
        <div className="lg:w-1/2 relative h-[50vh] lg:h-screen lg:sticky lg:top-0 overflow-hidden">
          {event.featured_image_url ? (
            <ProgressiveImage
              src={event.featured_image_url}
              alt={event.title}
              className="w-full h-full object-cover grayscale brightness-75 lg:brightness-100"
              loading="eager"
            />
          ) : currentSrc ? (
            <>
              {/* Immagine precedente (in uscita) — crossfade */}
              {prevSrc && transitioning && (
                <img
                  src={prevSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[600ms] grayscale brightness-75 lg:brightness-100"
                />
              )}
              {/* Immagine corrente artista con caricamento progressivo + crossfade */}
              <ProgressiveImage
                src={currentSrc}
                placeholder={currentThumb ?? undefined}
                alt={event.artist?.name ?? event.title}
                className={`w-full h-full object-cover grayscale brightness-75 lg:brightness-100 ${
                  transitioning ? "animate-fade-in" : ""
                }`}
                loading="eager"
              />
            </>
          ) : (
            <div
              className="w-full h-full bg-gradient-to-br from-[var(--glass)] to-[var(--bg-color)]"
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg-color)] lg:block hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] to-transparent lg:hidden block" />

          {/* Date box grande sovrapposto sull'immagine */}
          <div className="absolute bottom-8 left-8 lg:bottom-16 lg:left-16 z-10">
            <div className="glass-panel rounded-2xl border border-[var(--glass-border)] px-8 py-6 text-center">
              <span className="text-sm font-bold text-[var(--accent)] uppercase tracking-widest block mb-1">
                {date.toLocaleDateString("it-IT", { month: "short" })}
              </span>
              <span className="text-6xl lg:text-8xl font-heading font-black text-[var(--text-main)] leading-none block">
                {date.getDate()}
              </span>
              <span className="text-sm font-bold text-[var(--text-muted)] block mt-1">
                {date.getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {/* Lato destro: Contenuto */}
        <div className="lg:w-1/2 px-6 py-20 lg:p-24 flex flex-col">
          <div className="animate-in slide-in-from-right-12 duration-700">
            {/* Status badge */}
            <div className="mb-6">
              <span
                className={`inline-block text-xs font-black tracking-[0.3em] px-4 py-2 rounded-full border ${getStatusColor(event.status)}`}
              >
                {getStatusLabel(event.status)}
              </span>
            </div>

            {/* Titolo evento */}
            <h1 className="text-4xl lg:text-6xl font-heading font-extrabold tracking-tighter mb-8 leading-none text-[var(--text-main)]">
              {event.title}
            </h1>

            {/* Data e orari */}
            <div className="flex flex-wrap gap-6 mb-12">
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <Calendar size={20} className="text-[var(--accent)]" />
                <span className="font-semibold capitalize">{formattedDate}</span>
              </div>
              {event.start_time && (
                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                  <Clock size={20} className="text-[var(--accent)]" />
                  <span className="font-semibold">
                    Show {event.start_time.slice(0, 5)}
                  </span>
                </div>
              )}
              {event.doors_time && (
                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                  <Clock size={20} className="text-[var(--accent)]/60" />
                  <span className="font-semibold">
                    Porte {event.doors_time.slice(0, 5)}
                  </span>
                </div>
              )}
            </div>

            {/* Cards: Venue + Artista */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
              {/* Venue card */}
              {(venueName || city) && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-8 glass-panel rounded-3xl border border-[var(--glass-border)] flex flex-col gap-4 group cursor-pointer hover:border-[var(--accent)]/30 transition-all no-underline"
                  aria-label={`Naviga verso ${venueName}, ${city}`}
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--bg-color)] group-hover:scale-110 transition-transform shadow-lg">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-[var(--text-main)]">
                      {venueName}
                    </h4>
                    <p className="text-[var(--text-muted)] text-sm">
                      {city}
                      {region ? `, ${region}` : ""}
                      {country && country !== "IT" ? ` (${country})` : ""}
                    </p>
                    <p className="text-[var(--accent)] text-xs font-bold mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                      INDICAZIONI <ExternalLink size={12} />
                    </p>
                  </div>
                </a>
              )}

              {/* Artist card */}
              {event.artist && (
                <div
                  onClick={() => onArtistClick?.(event.artist!.id)}
                  className="p-8 glass-panel rounded-3xl border border-[var(--glass-border)] flex flex-col gap-4 group cursor-pointer hover:border-[var(--accent-secondary)]/30 transition-all active:scale-95"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && onArtistClick?.(event.artist!.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    {event.artist.image_url ? (
                      <img
                        src={event.artist.image_url}
                        alt={event.artist.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[var(--glass-border)] group-hover:border-[var(--accent)] transition-colors"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--accent-secondary)] flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                        <Music size={20} />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-xl text-[var(--text-main)]">
                        {event.artist.name}
                      </h4>
                      <p className="text-[var(--accent)] text-xs font-bold mt-1 flex items-center gap-1 group-hover:gap-2 transition-all">
                        VEDI PROFILO <ArrowRight size={12} />
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Biglietti */}
            {(event.ticket_url || event.ticket_price) && (
              <div className="mb-16">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                  <div className="w-8 h-[2px] bg-[var(--accent)]" />
                  BIGLIETTI
                </h3>
                <div className="glass-panel rounded-2xl border border-[var(--glass-border)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {event.ticket_price && (
                    <span className="text-2xl font-heading font-bold text-[var(--text-main)]">
                      {event.ticket_price}
                    </span>
                  )}
                  {event.ticket_url && (
                    <a
                      href={event.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent)] text-[var(--bg-color)] font-black tracking-widest rounded-full hover:scale-[1.02] transition-all shadow-lg shadow-[var(--accent)]/20 no-underline"
                    >
                      <Ticket size={20} />
                      ACQUISTA BIGLIETTI
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Descrizione (Rich Text) + Video embed */}
            {event.description && (
              <div className="mb-16">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                  <div className="w-8 h-[2px] bg-[var(--accent)]" />
                  DETTAGLI
                </h3>
                <div
                  className="prose prose-invert max-w-xl text-[var(--text-muted)] leading-relaxed
                    [&_p]:mb-4 [&_a]:text-[var(--accent)] [&_a]:underline [&_a:hover]:no-underline
                    [&_strong]:text-[var(--text-main)]"
                  dangerouslySetInnerHTML={{ __html: processDescription(event.description) }}
                />
              </div>
            )}

            {/* Altri eventi dello stesso artista */}
            {relatedEvents.length > 0 && (
              <div className="mb-16 pt-12 scroll-mt-24">
                <h3 className="text-3xl font-heading font-extrabold mb-10 flex items-center gap-4 text-[var(--text-main)]">
                  <span className="text-[var(--accent)]">/</span>
                  ALTRE DATE {event.artist?.name ? `DI ${event.artist.name}` : ""}
                </h3>
                <div className="flex flex-col gap-4">
                  {relatedEvents.map((relEvent) => {
                    const d = new Date(relEvent.start_date);
                    return (
                      <div
                        key={relEvent.id}
                        onClick={() => onEventClick?.(relEvent)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && onEventClick?.(relEvent)}
                        className="glass-panel group p-6 rounded-2xl border border-[var(--glass-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--glass)] hover:border-[var(--accent)]/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-center">
                            <span className="text-xs font-bold text-[var(--text-muted)] uppercase leading-none mb-1">
                              {d.toLocaleDateString("it-IT", { month: "short" })}
                            </span>
                            <span className="text-2xl font-black text-[var(--text-main)] leading-none">
                              {d.getDate()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-[var(--text-main)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                              {relEvent.title}
                            </h4>
                            {relEvent.venue && (
                              <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
                                <MapPin
                                  size={14}
                                  className="text-[var(--accent)]/60"
                                />
                                {relEvent.venue.name} — {relEvent.venue.city}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className={`text-[10px] font-black tracking-[0.2em] px-3 py-1.5 rounded border ${getStatusColor(relEvent.status)}`}
                        >
                          {getStatusLabel(relEvent.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA Booking */}
            <button
              onClick={handleBooking}
              className="w-full px-12 py-6 bg-[var(--text-main)] text-[var(--bg-color)] font-black tracking-widest hover:scale-[1.02] transition-all rounded-full text-lg shadow-xl shadow-[var(--accent)]/10"
            >
              RICHIEDI PREVENTIVO{event.artist?.name ? ` PER ${event.artist.name.toUpperCase()}` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
