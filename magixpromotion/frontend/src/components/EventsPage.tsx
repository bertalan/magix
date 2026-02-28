import React from "react";
import type { EventPage, ViewState } from "@/types";
import { useEvents } from "@/hooks/useEvents";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useLanguage } from "@/contexts/LanguageContext";
import EventCard from "./EventCard";
import EventFilters from "./EventFilters";
import { EventsListJsonLd } from "./JsonLdScript";
import { Calendar } from "lucide-react";

interface EventsPageProps {
  setView: (v: ViewState) => void;
  onArtistClick?: (artistId: number) => void;
  onEventClick?: (event: EventPage) => void;
  highlightedEventSlug?: string | null;
}

/**
 * Pagina eventi con tab PROSSIMI / ARCHIVIO,
 * filtro per città, raggruppamento per mese e infinite scroll.
 */
const EventsPage: React.FC<EventsPageProps> = ({ setView: _setView, onArtistClick, onEventClick, highlightedEventSlug }) => {
  const { t, lang } = useLanguage();
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming");
  const [cityFilter, setCityFilter] = React.useState("ALL");

  const today = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  // Parametri filtro (senza limit/offset — gestiti dal hook)
  const apiFilters = React.useMemo(() => {
    const p: {
      date_from?: string;
      date_to?: string;
      city?: string;
    } = {};
    if (tab === "upcoming") p.date_from = today;
    if (tab === "past") p.date_to = today;
    if (cityFilter !== "ALL") p.city = cityFilter;
    return p;
  }, [tab, cityFilter, today]);

  const { items: events, loading, loadingMore, error, hasMore, loadMore, totalCount } =
    useEvents(apiFilters);

  // Infinite scroll — sentinella in fondo alla lista
  const scrollDisabled = loading || loadingMore || !hasMore;
  const sentinelRef = useInfiniteScroll(loadMore, scrollDisabled);

  // Raggruppa eventi per data singola (es. "Venerdì 20 febbraio 2026")
  const groupedEvents = React.useMemo(() => {
    const dateLocale = lang === "en" ? "en-GB" : "it-IT";
    const groups: Record<string, EventPage[]> = {};
    events.forEach((ev) => {
      const date = new Date(ev.start_date);
      const key = date.toLocaleDateString(dateLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return groups;
  }, [events, lang]);

  // Extract unique cities for filter chips
  const cities = React.useMemo(() => {
    const set = new Set(
      events.map((e) => e.venue?.city).filter(Boolean) as string[],
    );
    return ["ALL", ...Array.from(set).sort()];
  }, [events]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-24">
      {/* SEO: JSON-LD ItemList per gli eventi */}
      <EventsListJsonLd lang={lang} />

      {/* Page header */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-[var(--accent)]" size={28} />
          <h2 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight text-[var(--text-main)] uppercase">
            {t("events.title")}
          </h2>
        </div>
        <p className="text-[var(--text-muted)] text-lg max-w-xl">
          {t("events.subtitle")}
        </p>
      </div>

      {/* Tabs: Prossimi / Archivio */}
      <div className="flex gap-4 mb-8" role="tablist" aria-label={t("events.filterAria")}>
        <button
          onClick={() => {
            setTab("upcoming");
            setCityFilter("ALL");
          }}
          role="tab"
          id="tab-upcoming"
          aria-selected={tab === "upcoming"}
          aria-controls="tabpanel-events"
          className={`px-6 py-3 rounded-full font-bold text-sm tracking-widest transition-all ${
            tab === "upcoming"
              ? "bg-[var(--accent)] text-[var(--bg-color)] shadow-lg"
              : "bg-[var(--glass)] text-[var(--text-muted)]"
          }`}
        >
          {t("events.upcoming")}
        </button>
        <button
          onClick={() => {
            setTab("past");
            setCityFilter("ALL");
          }}
          role="tab"
          id="tab-past"
          aria-selected={tab === "past"}
          aria-controls="tabpanel-events"
          className={`px-6 py-3 rounded-full font-bold text-sm tracking-widest transition-all ${
            tab === "past"
              ? "bg-[var(--accent)] text-[var(--bg-color)] shadow-lg"
              : "bg-[var(--glass)] text-[var(--text-muted)]"
          }`}
        >
          {t("events.past")}
        </button>
      </div>

      {/* City filter */}
      <EventFilters
        cities={cities}
        activeCity={cityFilter}
        onCityChange={setCityFilter}
      />

      {/* Conteggio eventi */}
      {!loading && totalCount > 0 && (
        <p className="text-sm text-[var(--text-muted)] mt-4">
          {t("events.countOf", { loaded: events.length, total: totalCount })}
        </p>
      )}

      {/* Skeleton caricamento iniziale */}
      {loading && (
        <div className="space-y-4 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-[var(--glass)] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-16 text-rose-500">
          {t("events.loadError")}: {error.message}
        </div>
      )}

      {/* Events grouped by month */}
      {!loading && !error && (
        <div
          className="mt-8"
          role="tabpanel"
          id="tabpanel-events"
          aria-labelledby={tab === "upcoming" ? "tab-upcoming" : "tab-past"}
        >
          {Object.keys(groupedEvents).length > 0 ? (
            <>
              {Object.entries(groupedEvents).map(([dateLabel, dateEvents]) => (
                <div key={dateLabel} className="mb-10">
                  <h3 className="text-lg font-heading font-bold text-[var(--accent)] mb-4 capitalize tracking-wide">
                    {dateLabel}
                  </h3>
                  <div className="flex flex-col gap-4">
                    {dateEvents.map((event) => (
                      <EventCard key={event.id} event={event} onArtistClick={onArtistClick} onEventClick={onEventClick} highlighted={highlightedEventSlug === event.meta.slug} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Skeleton per caricamento pagine successive */}
              {loadingMore && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={`more-${i}`}
                      className="h-24 rounded-2xl bg-[var(--glass)] animate-pulse"
                    />
                  ))}
                </div>
              )}

              {/* Sentinella Intersection Observer */}
              <div
                ref={sentinelRef}
                className="h-4"
                role="status"
                aria-label={hasMore ? t("events.loadingMore") : ""}
              />
            </>
          ) : (
            <div className="text-center py-24 text-[var(--text-muted)]">
              <p className="text-xl">
                {tab === "upcoming"
                  ? t("events.noUpcoming")
                  : t("events.noPast")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
