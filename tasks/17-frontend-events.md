# TASK 17 — Frontend Eventi

> **Agente:** Frontend  
> **Fase:** 4 — Frontend  
> **Dipendenze:** Task 13  
> **Stima:** 25 min  

---

## OBIETTIVO

Creare la vista EVENTS che mostra gli eventi futuri e passati in una timeline/lista. Il template-strutturale NON ha un componente eventi standalone — gli eventi sono solo nella sezione detail artista. Questo task crea la vista dedicata.

---

## FILES_IN_SCOPE (da leggere)

- `template-strutturale/components/TalentDetail.tsx` — Sezione eventi (per stile)
- `frontend/src/types.ts` — MusicEvent interface
- `frontend/src/hooks/useEvents.ts`

---

## OUTPUT_ATTESO

```
frontend/src/components/
├── EventsPage.tsx        # Vista principale eventi con tabs
├── EventCard.tsx          # Card singolo evento
├── EventFilters.tsx       # Filtri (mese, città, artista)
├── AddressLink.tsx        # Deep link navigazione mobile/desktop (Google Maps)
```

---

## SPECIFICHE

### 1. EventsPage.tsx

```tsx
import React from "react";
import { MusicEvent, ViewState } from "@/types";
import { useEvents } from "@/hooks/useEvents";
import EventCard from "./EventCard";
import EventFilters from "./EventFilters";
import { Calendar } from "lucide-react";

interface EventsPageProps {
  setView: (v: ViewState) => void;
}

const EventsPage: React.FC<EventsPageProps> = ({ setView }) => {
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming");
  const [cityFilter, setCityFilter] = React.useState("ALL");

  const apiParams = React.useMemo(() => {
    const p: Record<string, string> = { fields: "*", limit: "50" };
    // L'API backend filtra per date future/passate
    if (tab === "upcoming") p["date_from"] = new Date().toISOString().split("T")[0];
    if (tab === "past") p["date_to"] = new Date().toISOString().split("T")[0];
    if (cityFilter !== "ALL") p["city"] = cityFilter;
    return p;
  }, [tab, cityFilter]);

  const { events, loading, error } = useEvents(apiParams);

  // Raggruppa eventi per mese
  const groupedEvents = React.useMemo(() => {
    const groups: Record<string, MusicEvent[]> = {};
    events.forEach((ev) => {
      const date = new Date(ev.date_start);
      const key = date.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return groups;
  }, [events]);

  const cities = React.useMemo(() => {
    const set = new Set(events.map((e) => e.city).filter(Boolean));
    return ["ALL", ...Array.from(set).sort()];
  }, [events]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-24">
      {/* Header */}
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

      {/* Tabs: Prossimi / Passati */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setTab("upcoming")}
          className={`px-6 py-3 rounded-full font-bold text-sm tracking-widest transition-all ${
            tab === "upcoming"
              ? "bg-[var(--accent)] text-[var(--bg-color)] shadow-lg"
              : "bg-[var(--glass)] text-[var(--text-muted)]"
          }`}
        >
          PROSSIMI
        </button>
        <button
          onClick={() => setTab("past")}
          className={`px-6 py-3 rounded-full font-bold text-sm tracking-widest transition-all ${
            tab === "past"
              ? "bg-[var(--accent)] text-[var(--bg-color)] shadow-lg"
              : "bg-[var(--glass)] text-[var(--text-muted)]"
          }`}
        >
          ARCHIVIO
        </button>
      </div>

      {/* Filtri città */}
      <EventFilters
        cities={cities}
        activeCity={cityFilter}
        onCityChange={setCityFilter}
      />

      {/* Loading */}
      {loading && (
        <div className="space-y-4 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--glass)] animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16 text-rose-500">
          Errore: {error}
        </div>
      )}

      {/* Lista eventi raggruppata per mese */}
      {!loading && !error && (
        <div className="mt-8">
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
```

### 2. EventCard.tsx

```tsx
import React from "react";
import { MusicEvent } from "@/types";
import { MapPin, Ticket } from "lucide-react";

interface EventCardProps {
  event: MusicEvent;
}

const getStatusColor = (status: MusicEvent["status"]) => {
  switch (status) {
    case "SOLD OUT": return "text-rose-500 border-rose-500/30 bg-rose-500/5";
    case "LOW TICKETS": return "text-amber-500 border-amber-500/30 bg-amber-500/5";
    case "FREE": return "text-emerald-500 border-emerald-500/30 bg-emerald-500/5";
    default: return "text-[var(--accent)] border-[var(--glass-border)] bg-[var(--accent)]/5";
  }
};

const getStatusLabel = (status: MusicEvent["status"]) => {
  switch (status) {
    case "SOLD OUT": return "SOLD OUT";
    case "LOW TICKETS": return "ULTIMI POSTI";
    case "FREE": return "INGRESSO LIBERO";
    default: return "DISPONIBILE";
  }
};

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const date = new Date(event.date_start);

  return (
    <article className="glass-panel group p-6 rounded-2xl border border-[var(--glass-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--glass)] hover:border-[var(--accent)]/30 transition-all">
      <div className="flex items-center gap-6">
        {/* Data box */}
        <div className="flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-center">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase leading-none mb-1">
            {date.toLocaleDateString("it-IT", { month: "short" })}
          </span>
          <span className="text-2xl font-black text-[var(--text-main)] leading-none">
            {date.getDate()}
          </span>
        </div>

        {/* Info evento */}
        <div>
          <h4 className="text-xl font-bold text-[var(--text-main)] mb-1 group-hover:text-[var(--accent)] transition-colors">
            {event.title || event.venue_name}
          </h4>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
            <MapPin size={14} className="text-[var(--accent)]/60" />
            <AddressLink
              venueName={event.venue_name}
              city={event.city}
              country={event.country}
              lat={event.venue_lat}
              lng={event.venue_lng}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6">
        <div className={`text-[10px] font-black tracking-[0.2em] px-3 py-1.5 rounded border ${getStatusColor(event.status)}`}>
          {getStatusLabel(event.status)}
        </div>
        <button
          className="p-3 rounded-full bg-[var(--text-main)] text-[var(--bg-color)] hover:scale-110 transition-transform group-hover:bg-[var(--accent)]"
          aria-label={`Biglietti per ${event.title || event.venue_name}`}
        >
          <Ticket size={20} />
        </button>
      </div>
    </article>
  );
};

export default EventCard;
```

### 3. EventFilters.tsx

```tsx
import React from "react";

interface EventFiltersProps {
  cities: string[];
  activeCity: string;
  onCityChange: (city: string) => void;
}

const EventFilters: React.FC<EventFiltersProps> = ({
  cities,
  activeCity,
  onCityChange,
}) => {
  if (cities.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {cities.map((city) => (
        <button
          key={city}
          onClick={() => onCityChange(city)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all border ${
            activeCity === city
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
          }`}
        >
          {city === "ALL" ? "TUTTE LE CITTÀ" : city.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default EventFilters;
```

### 4. AddressLink.tsx — Deep link navigazione

```tsx
import React from "react";
import { ExternalLink } from "lucide-react";

interface AddressLinkProps {
  venueName: string;
  city: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
}

/**
 * Genera un link di navigazione universale.
 * - Con lat/lng: deep link preciso a Google Maps
 * - Senza lat/lng: ricerca per indirizzo su Google Maps
 * - Mostra città + country se diverso da IT
 */
const AddressLink: React.FC<AddressLinkProps> = ({ venueName, city, country, lat, lng }) => {
  const navigationUrl = lat && lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venueName}, ${city}`)}`;

  const displayLocation = country && country !== "IT"
    ? `${venueName} — ${city} (${country})`
    : `${venueName} — ${city}`;

  return (
    <a
      href={navigationUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
      aria-label={`Naviga verso ${venueName}, ${city}`}
    >
      {displayLocation}
      <ExternalLink size={12} className="opacity-50" />
    </a>
  );
};

export default AddressLink;
``` Il template-strutturale mostra eventi SOLO dentro `TalentDetail`. Questo task crea una vista dedicata con timeline raggruppata per mese.
2. **Raggruppamento mesi:** Gli eventi sono raggruppati per `"mese anno"` (es: "giugno 2025") usando `toLocaleDateString("it-IT")`.
3. **Tabs upcoming/past:** Il filtro temporale è delegato al backend API. Il frontend passa `date_from` o `date_to` come query params.
4. **StatusLabel IT:** `FREE` → `INGRESSO LIBERO`, `LOW TICKETS` → `ULTIMI POSTI`, `AVAILABLE` → `DISPONIBILE`.
5. **Nessun link artista:** Gli eventi mostrano venue + città (+ paese se non IT). Se necessario aggiungere il link all'artista, va fatto in un task successivo.
6. **AddressLink:** Componente riutilizzabile per deep link navigazione. Usa Google Maps URL universale (funziona su Android, iOS e desktop). Se il venue ha lat/lng (da Nominatim), usa coordinate precise.

---

## CRITERI DI ACCETTAZIONE

- [ ] Vista EVENTS mostra eventi raggruppati per mese
- [ ] Tab "PROSSIMI" e "ARCHIVIO" funzionanti
- [ ] Filtro per città funzionante
- [ ] Skeleton loading visibile durante fetch
- [ ] EventCard mostra data, venue, città, status
- [ ] EventCard mostra paese se diverso da IT
- [ ] AddressLink genera deep link a Google Maps
- [ ] AddressLink usa coordinate lat/lng se disponibili
- [ ] Status labels tradotti in italiano
- [ ] Date formattate in locale it-IT
- [ ] Messaggio "Nessun evento in programma" se lista vuota
- [ ] Layout responsive (stack mobile → row desktop)

---

## SEZIONE TDD

```tsx
// src/components/__tests__/AddressLink.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/utils";
import AddressLink from "../AddressLink";

describe("AddressLink", () => {
  it("genera link con coordinate se disponibili", () => {
    render(<AddressLink venueName="Pub" city="Milano" lat={45.46} lng={9.19} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expect.stringContaining("45.46,9.19"));
  });

  it("genera link con indirizzo se senza coordinate", () => {
    render(<AddressLink venueName="Pub" city="Milano" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expect.stringContaining("Pub"));
  });

  it("mostra il paese se non IT", () => {
    render(<AddressLink venueName="Club" city="Zürich" country="CH" />);
    expect(screen.getByText(/CH/)).toBeInTheDocument();
  });

  it("non mostra il paese se IT", () => {
    render(<AddressLink venueName="Pub" city="Milano" country="IT" />);
    expect(screen.queryByText("(IT)")).not.toBeInTheDocument();
  });
});
```

---

## SECURITY CHECKLIST

- [ ] Link esterni hanno `rel="noopener noreferrer"`
- [ ] Nessun dato utente inviato al servizio mappe
- [ ] Coordinate non espongono informazioni private
