import React from "react";
import type { EventPage } from "@/types";
import { MapPin, Ticket } from "lucide-react";
import AddressLink from "./AddressLink";

interface EventCardProps {
  event: EventPage;
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
const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const date = new Date(event.start_date);

  const venueName = event.venue?.name ?? "";
  const city = event.venue?.city ?? "";
  const country = event.venue?.country ?? "";
  const lat = event.venue?.latitude ?? null;
  const lng = event.venue?.longitude ?? null;

  return (
    <article
      className="glass-panel group p-6 rounded-2xl border border-[var(--glass-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--glass)] hover:border-[var(--accent)]/30 transition-all"
      aria-label={`${event.title || venueName} — ${date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}${city ? `, ${city}` : ""}`}
    >
      <div className="flex items-center gap-6">
        {/* Date box */}
        <div className="flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-center">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase leading-none mb-1">
            {date.toLocaleDateString("it-IT", { month: "short" })}
          </span>
          <span className="text-2xl font-black text-[var(--text-main)] leading-none">
            {date.getDate()}
          </span>
        </div>

        {/* Event info */}
        <div>
          <h4 className="text-xl font-bold text-[var(--text-main)] mb-1 group-hover:text-[var(--accent)] transition-colors">
            {event.title || venueName}
          </h4>
          {(venueName || city) && (
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
              <MapPin size={14} className="text-[var(--accent)]/60" />
              <AddressLink
                venueName={venueName}
                city={city}
                country={country}
                lat={lat}
                lng={lng}
              />
            </div>
          )}
          {event.start_time && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Ore {event.start_time.slice(0, 5)}
              {event.doors_time && ` (Porte ${event.doors_time.slice(0, 5)})`}
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
