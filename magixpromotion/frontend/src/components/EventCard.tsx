import React from "react";
import type { EventPage } from "@/types";
import { MapPin, Music, Ticket } from "lucide-react";

interface EventCardProps {
  event: EventPage;
  onArtistClick?: (artistId: number) => void;
  onEventClick?: (event: EventPage) => void;
  highlighted?: boolean;
}

/**
 * Map EventPage.status to a colour scheme for the status badge.
 */
const getStatusColor = (status: EventPage["status"]): string => {
  switch (status) {
    case "sold_out":
      return "text-rose-500 border-rose-500/30 bg-rose-500/5";
    case "cancelled":
      return "text-neutral-400 border-neutral-400/30 bg-neutral-400/5 line-through";
    case "postponed":
      return "text-amber-500 border-amber-500/30 bg-amber-500/5";
    case "tentative":
      return "text-sky-400 border-sky-400/30 bg-sky-400/5";
    case "confirmed":
    default:
      return "text-[var(--accent)] border-[var(--glass-border)] bg-[var(--accent)]/5";
  }
};

/**
 * Italian labels for each event status.
 */
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

/**
 * Single event card showing date-box, venue, city, status badge,
 * and a ticket button linking to the external ticket URL.
 */
const EventCard: React.FC<EventCardProps> = ({ event, onArtistClick, onEventClick, highlighted }) => {
  const date = new Date(event.start_date);
  const cardRef = React.useRef<HTMLElement>(null);

  // Auto-scroll to the highlighted card on mount
  React.useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  const venueName = event.venue?.name ?? "";
  const city = event.venue?.city ?? "";
  const country = event.venue?.country ?? "";
  const lat = event.venue?.latitude ?? null;
  const lng = event.venue?.longitude ?? null;

  return (
    <article
      ref={cardRef}
      className={`glass-panel group p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--glass)] hover:border-[var(--accent)]/30 transition-all cursor-pointer ${
        highlighted
          ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-[var(--accent)]/5"
          : "border-[var(--glass-border)]"
      }`}
      aria-label={`${event.title || venueName} — ${date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}${city ? `, ${city}` : ""}`}
      onClick={() => onEventClick?.(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onEventClick?.(event)}
    >
      <div className="flex items-center gap-6">
        {/* Date box con orario */}
        <div className="flex flex-col items-center justify-center min-w-[70px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-center px-2 py-2">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase leading-none mb-1">
            {date.toLocaleDateString("it-IT", { month: "short" })}
          </span>
          <span className="text-2xl font-black text-[var(--text-main)] leading-none">
            {date.getDate()}
          </span>
          {event.start_time && (
            <span className="text-[11px] font-semibold text-[var(--accent)] leading-none mt-1">
              {event.start_time.slice(0, 5)}
            </span>
          )}
        </div>

        {/* Event info */}
        <div>
          <h4 className="text-xl font-bold text-[var(--text-main)] mb-1 group-hover:text-[var(--accent)] transition-colors">
            {event.title || venueName}
          </h4>
          {event.artist?.name && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] mb-1">
              <Music size={13} className="opacity-70" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onArtistClick && event.artist) onArtistClick(event.artist.id);
                }}
                className="hover:underline hover:text-[var(--text-main)] transition-colors cursor-pointer bg-transparent border-none p-0 font-semibold text-sm text-[var(--accent)] text-left"
              >
                {event.artist.name}
              </button>
            </p>
          )}
          {(venueName || city) && (
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
              <MapPin size={14} className="text-[var(--accent)]/60" />
              <a
                href={
                  lat && lng
                    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueName}, ${city}`)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-[var(--accent)] transition-colors"
                aria-label={`Naviga verso ${venueName}, ${city}`}
              >
                {country && country !== "IT"
                  ? `${venueName} \u2014 ${city} (${country})`
                  : `${venueName} \u2014 ${city}`}
              </a>
            </div>
          )}
          {event.doors_time && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Porte {event.doors_time.slice(0, 5)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6">
        {/* Status badge */}
        <div
          className={`text-[10px] font-black tracking-[0.2em] px-3 py-1.5 rounded border ${getStatusColor(event.status)}`}
        >
          {getStatusLabel(event.status)}
        </div>

        {/* Ticket / price info */}
        {event.ticket_url ? (
          <a
            href={event.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-3 rounded-full bg-[var(--text-main)] text-[var(--bg-color)] hover:scale-110 transition-transform group-hover:bg-[var(--accent)]"
            aria-label={`Biglietti per ${event.title || venueName}`}
          >
            <Ticket size={20} />
          </a>
        ) : (
          <div
            className="p-3 rounded-full bg-[var(--glass)] text-[var(--text-muted)] border border-[var(--glass-border)]"
            aria-label="Biglietti non disponibili"
          >
            <Ticket size={20} />
          </div>
        )}
      </div>
    </article>
  );
};

export default EventCard;
