import React from "react";
import type { EventPage, ViewState } from "@/types";
import { useEvents } from "@/hooks/useEvents";
import EventCard from "./EventCard";
import EventFilters from "./EventFilters";
import { Calendar } from "lucide-react";

interface EventsPageProps {
  setView: (v: ViewState) => void;
}

/**
 * Main events view with PROSSIMI / ARCHIVIO tabs,
 * city filter, and events grouped by month.
 */
const EventsPage: React.FC<EventsPageProps> = ({ setView: _setView }) => {
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming");
  const [cityFilter, setCityFilter] = React.useState("ALL");

  const today = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  const apiParams = React.useMemo(() => {
    const p: {
      date_from?: string;
      date_to?: string;
      city?: string;
      limit?: number;
    } = { limit: 50 };
    if (tab === "upcoming") p.date_from = today;
    if (tab === "past") p.date_to = today;
    if (cityFilter !== "ALL") p.city = cityFilter;
    return p;
  }, [tab, cityFilter, today]);

  const { data, loading, error } = useEvents(apiParams);
  const events: EventPage[] = data?.items ?? [];

  // Group events by month (e.g. "giugno 2025")
  const groupedEvents = React.useMemo(() => {
    const groups: Record<string, EventPage[]> = {};
    events.forEach((ev) => {
      const date = new Date(ev.start_date);
      const key = date.toLocaleDateString("it-IT", {
        month: "long",
        year: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return groups;
  }, [events]);

  // Extract unique cities for filter chips
  const cities = React.useMemo(() => {
    const set = new Set(
      events.map((e) => e.venue?.city).filter(Boolean) as string[],
    );
    return ["ALL", ...Array.from(set).sort()];
  }, [events]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-24">
      {/* Page header */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-[var(--accent)]" size={28} />
          <h2 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight text-[var(--text-main)] uppercase">
            Eventi
          </h2>
        </div>
        <p className="text-[var(--text-muted)] text-lg max-w-xl">
          Tutte le date live delle nostre band e artisti in Italia e nel mondo.
        </p>
      </div>

      {/* Tabs: Prossimi / Archivio */}
      <div className="flex gap-4 mb-8" role="tablist" aria-label="Filtro eventi">
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
          PROSSIMI
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
          ARCHIVIO
        </button>
      </div>

      {/* City filter */}
      <EventFilters
        cities={cities}
        activeCity={cityFilter}
        onCityChange={setCityFilter}
      />

      {/* Loading skeleton */}
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
          Errore nel caricamento degli eventi: {error.message}
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
            Object.entries(groupedEvents).map(([month, monthEvents]) => (
              <div key={month} className="mb-12">
                <h3 className="text-xl font-heading font-bold text-[var(--accent)] mb-6 uppercase tracking-widest">
                  {month}
                </h3>
                <div className="flex flex-col gap-4">
                  {monthEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 text-[var(--text-muted)]">
              <p className="text-xl">
                {tab === "upcoming"
                  ? "Nessun evento in programma. Torna presto!"
                  : "Nessun evento nell'archivio."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
