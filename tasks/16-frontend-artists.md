# TASK 16 — Frontend Artisti (Grid + Card + Detail)

> **Agente:** Frontend  
> **Fase:** 4 — Frontend  
> **Dipendenze:** Task 13, Task 14  
> **Stima:** 35 min  

---

## OBIETTIVO

Adattare i componenti `TalentGrid.tsx`, `ArtistCard.tsx` e `TalentDetail.tsx` dal template per consumare l'API Wagtail. Aggiungere:
1. Filtri per genere, tipo artista, regione (da API)
2. Paginazione o infinite scroll
3. Dettaglio artista con StreamField body, video embed, gallery
4. Pulsante "Richiedi Preventivo" che prepopola il form booking

---

## FILES_IN_SCOPE (da leggere)

- `template-strutturale/components/TalentGrid.tsx` — Grid con filtro genere + search
- `template-strutturale/components/ArtistCard.tsx` — Card 3:4 con hover effects
- `template-strutturale/components/TalentDetail.tsx` — Full-screen detail overlay
- `frontend/src/types.ts` — Interface Artist, MusicEvent
- `frontend/src/hooks/useArtists.ts`

---

## OUTPUT_ATTESO

```
frontend/src/components/
├── ArtistGrid.tsx        # Grid filtrabile con search (da TalentGrid)
├── ArtistCard.tsx         # Card singolo artista (da ArtistCard)
├── ArtistDetail.tsx       # Detail overlay full-screen (da TalentDetail)
├── ArtistFilters.tsx      # Barra filtri estratta per chiarezza
```

---

## SPECIFICHE

### 1. ArtistGrid.tsx — Grid con filtri da API

```tsx
import React from "react";
import { Artist, ViewState } from "@/types";
import { useArtists } from "@/hooks/useArtists";
import ArtistCard from "./ArtistCard";
import ArtistFilters from "./ArtistFilters";

interface ArtistGridProps {
  onArtistClick: (artist: Artist) => void;
}

const ArtistGrid: React.FC<ArtistGridProps> = ({ onArtistClick }) => {
  const [filter, setFilter] = React.useState("ALL");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");

  // Costruisci parametri per API in base ai filtri attivi
  const apiParams = React.useMemo(() => {
    const p: Record<string, string> = { fields: "*", limit: "50" };
    if (filter !== "ALL") p["genre"] = filter;
    if (typeFilter !== "ALL") p["artist_type"] = typeFilter;
    if (search) p["search"] = search;
    return p;
  }, [filter, typeFilter, search]);

  const { artists, loading, error } = useArtists(apiParams);

  // Estrai generi unici per filtri (da tutti gli artisti caricati)
  const genres = React.useMemo(() => {
    const set = new Set(artists.flatMap((a) => a.genres || [a.genre]));
    return ["ALL", ...Array.from(set).sort()];
  }, [artists]);

  const artistTypes = [
    "ALL",
    "band",
    "solo",
    "duo",
    "dj",
    "orchestra",
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      {/* Header con titolo e filtri */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
        <div>
          <h2 className="text-4xl md:text-6xl font-heading font-extrabold mb-4 tracking-tight text-[var(--text-main)] uppercase">
            Il Nostro Roster
          </h2>
          <ArtistFilters
            genres={genres}
            activeGenre={filter}
            onGenreChange={setFilter}
            artistTypes={artistTypes}
            activeType={typeFilter}
            onTypeChange={setTypeFilter}
          />
        </div>

        {/* Search */}
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Cerca artista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--glass)] border border-[var(--glass-border)] px-6 py-3 rounded-full text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent)]/50 transition-all"
            aria-label="Cerca artista per nome o genere"
          />
        </div>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-3xl bg-[var(--glass)] animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-24 text-rose-500">
          <p>Errore nel caricamento: {error}</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {artists.length > 0 ? (
            artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onClick={() => onArtistClick(artist)}
              />
            ))
          ) : (
            <div className="col-span-full py-24 text-center text-[var(--text-muted)]">
              <p className="text-xl">Nessun artista trovato con questi filtri.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtistGrid;
```

### 2. ArtistFilters.tsx — Filtri estratti

```tsx
import React from "react";

interface ArtistFiltersProps {
  genres: string[];
  activeGenre: string;
  onGenreChange: (genre: string) => void;
  artistTypes: string[];
  activeType: string;
  onTypeChange: (type: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  ALL: "TUTTI",
  band: "BAND",
  solo: "SOLISTA",
  duo: "DUO",
  dj: "DJ",
  orchestra: "ORCHESTRA",
};

const ArtistFilters: React.FC<ArtistFiltersProps> = ({
  genres,
  activeGenre,
  onGenreChange,
  artistTypes,
  activeType,
  onTypeChange,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Filtro genere */}
      <div className="flex flex-wrap gap-2">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => onGenreChange(g)}
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all ${
              activeGenre === g
                ? "bg-[var(--accent)] text-[var(--bg-color)] shadow-lg shadow-[var(--accent)]/20"
                : "bg-[var(--glass)] text-[var(--text-muted)] hover:bg-[var(--glass-border)]"
            }`}
          >
            {g.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Filtro tipo artista */}
      <div className="flex flex-wrap gap-2">
        {artistTypes.map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all border ${
              activeType === t
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
            }`}
          >
            {TYPE_LABELS[t] || t.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArtistFilters;
```

### 3. ArtistCard.tsx — Adattato per API

```tsx
import React from "react";
import { Artist } from "@/types";
import { Plus } from "lucide-react";

interface ArtistCardProps {
  artist: Artist;
  onClick: () => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  return (
    <article
      className="group relative cursor-pointer overflow-hidden rounded-3xl aspect-[3/4] glass-panel transition-all duration-500 hover:-translate-y-2 shadow-[var(--card-shadow)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Vedi dettagli di ${artist.name}`}
    >
      {/* Immagine artista */}
      <img
        src={artist.image_url || artist.hero_image_url || ""}
        alt={artist.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-transparent to-transparent group-hover:via-[var(--bg-color)]/20 transition-all duration-500" />

      {/* Plus icon */}
      <div className="absolute top-6 right-6 w-12 h-12 rounded-full glass-panel border border-[var(--glass-border)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
        <Plus className="text-[var(--text-main)]" />
      </div>

      {/* Contenuto */}
      <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-transform duration-500 group-hover:translate-y-[-8px]">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
          {(artist.tags || []).slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-black bg-[var(--accent)] text-[var(--bg-color)] px-2 py-0.5 rounded tracking-tighter shadow-sm"
            >
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
        <h3 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tighter text-[var(--text-main)] mb-2 leading-none">
          {artist.name}
        </h3>
        <p className="text-[var(--text-muted)] text-sm font-medium tracking-wide">
          {artist.genre.toUpperCase()}
        </p>
      </div>

      {/* Hover highlight line */}
      <div className="absolute bottom-0 left-0 w-0 h-1.5 bg-[var(--accent-gradient)] transition-all duration-500 group-hover:w-full" />
    </article>
  );
};

export default ArtistCard;
```

### 4. ArtistDetail.tsx — Detail con booking link

```tsx
import React from "react";
import { Artist, MusicEvent, ViewState } from "@/types";
import { X, Instagram, Facebook, Music, Play, Volume2, MapPin, Ticket, Youtube } from "lucide-react";

interface ArtistDetailProps {
  artist: Artist;
  onClose: () => void;
  setView?: (v: ViewState) => void;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({ artist, onClose, setView }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const eventsRef = React.useRef<HTMLDivElement>(null);

  const handlePlayClick = () => {
    if (artist.youtube_url) {
      window.open(artist.youtube_url, "_blank", "noopener");
    }
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  const handleBooking = () => {
    onClose();
    // Naviga a booking con artista preselezionato
    if (setView) {
      // Il form booking leggerà l'artista dallo state/URL params
      setView("BOOKING");
    }
  };

  const getStatusColor = (status: MusicEvent["status"]) => {
    switch (status) {
      case "SOLD OUT": return "text-rose-500 border-rose-500/30 bg-rose-500/5";
      case "LOW TICKETS": return "text-amber-500 border-amber-500/30 bg-amber-500/5";
      case "FREE": return "text-emerald-500 border-emerald-500/30 bg-emerald-500/5";
      default: return "text-[var(--accent)] border-[var(--glass-border)] bg-[var(--accent)]/5";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-[var(--bg-color)] animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={`Profilo artista: ${artist.name}`}
    >
      {/* Notifica riproduzione */}
      {isPlaying && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-top-8 duration-500">
          <div className="glass-panel px-8 py-4 rounded-full border border-[var(--accent)]/30 flex items-center gap-4 shadow-xl">
            <Volume2 className="text-[var(--accent)] animate-pulse" />
            <span className="font-bold tracking-tight text-[var(--text-main)]">
              Video promo di <span className="text-[var(--accent)]">{artist.name}</span>
            </span>
          </div>
        </div>
      )}

      {/* Close */}
      <button
        onClick={onClose}
        className="fixed top-8 right-8 z-[70] p-4 glass-panel rounded-full text-[var(--text-main)] hover:bg-[var(--glass)] transition-colors"
        aria-label="Chiudi profilo artista"
      >
        <X size={32} />
      </button>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Lato sinistro: Immagine */}
        <div className="lg:w-1/2 relative h-[50vh] lg:h-screen lg:sticky lg:top-0">
          <img
            src={artist.hero_image_url || artist.image_url}
            alt={artist.name}
            className="w-full h-full object-cover grayscale brightness-75 lg:brightness-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg-color)] lg:block hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] to-transparent lg:hidden block" />
        </div>

        {/* Lato destro: Contenuto */}
        <div className="lg:w-1/2 px-6 py-20 lg:p-24 flex flex-col">
          <div className="animate-in slide-in-from-right-12 duration-700">
            {/* Tipo artista */}
            <span className="text-[var(--accent)] font-bold tracking-[0.4em] text-sm mb-6 block uppercase">
              {artist.artist_type || "Artista"}
            </span>

            <h1 className="text-6xl lg:text-9xl font-heading font-extrabold tracking-tighter mb-8 leading-none text-[var(--text-main)]">
              {artist.name}
            </h1>

            {/* Genere + Social */}
            <div className="flex flex-wrap gap-4 mb-12">
              <span className="px-6 py-3 glass-panel rounded-full border border-[var(--glass-border)] text-[var(--text-muted)] font-bold text-sm">
                {artist.genre}
              </span>
              <div className="flex gap-4 items-center">
                {artist.socials?.instagram && (
                  <a href={artist.socials.instagram} target="_blank" rel="noopener" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" aria-label="Instagram">
                    <Instagram size={24} />
                  </a>
                )}
                {artist.socials?.facebook && (
                  <a href={artist.socials.facebook} target="_blank" rel="noopener" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" aria-label="Facebook">
                    <Facebook size={24} />
                  </a>
                )}
                {artist.socials?.spotify && (
                  <a href={artist.socials.spotify} target="_blank" rel="noopener" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" aria-label="Spotify">
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
                {artist.bio}
              </p>
            </div>

            {/* Video + Tour cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
              <div
                onClick={handlePlayClick}
                className="p-8 glass-panel rounded-3xl border border-[var(--glass-border)] flex flex-col gap-4 group cursor-pointer hover:border-[var(--accent)]/30 transition-all active:scale-95"
                role="button"
                tabIndex={0}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--bg-color)] group-hover:scale-110 transition-transform shadow-lg">
                  {artist.youtube_url ? <Youtube size={20} /> : <Play fill="currentColor" size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-xl uppercase text-[var(--text-main)]">Video Promo</h4>
                  <p className="text-[var(--text-muted)] text-sm">
                    {artist.youtube_url ? "Guarda su YouTube" : "Video non disponibile"}
                  </p>
                </div>
              </div>
              <div
                onClick={() => eventsRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="p-8 glass-panel rounded-3xl border border-[var(--glass-border)] flex flex-col gap-4 group cursor-pointer hover:border-[var(--accent-secondary)]/30 transition-all active:scale-95"
                role="button"
                tabIndex={0}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--accent-secondary)] flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                  <Music size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xl uppercase text-[var(--text-main)]">Date Live</h4>
                  <p className="text-[var(--text-muted)] text-sm">
                    {artist.events?.length || 0} eventi in programma
                  </p>
                </div>
              </div>
            </div>

            {/* Eventi */}
            <div ref={eventsRef} className="pt-12 mb-16 scroll-mt-24">
              <h3 className="text-3xl font-heading font-extrabold mb-10 flex items-center gap-4 text-[var(--text-main)]">
                <span className="text-[var(--accent)]">/</span> PROSSIMI EVENTI
              </h3>
              <div className="flex flex-col gap-4">
                {(artist.events || []).length > 0 ? (
                  artist.events.map((event) => (
                    <div
                      key={event.id}
                      className="glass-panel group p-6 rounded-2xl border border-[var(--glass-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--glass)] hover:border-[var(--accent)]/30 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-center">
                          <span className="text-xs font-bold text-[var(--text-muted)] uppercase leading-none mb-1">
                            {new Date(event.date_start).toLocaleDateString("it-IT", { month: "short" })}
                          </span>
                          <span className="text-2xl font-black text-[var(--text-main)] leading-none">
                            {new Date(event.date_start).getDate()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-[var(--text-main)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                            {event.venue_name}
                          </h4>
                          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
                            <MapPin size={14} className="text-[var(--accent)]/60" />
                            {event.city}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className={`text-[10px] font-black tracking-[0.2em] px-3 py-1.5 rounded border ${getStatusColor(event.status)}`}>
                          {event.status === "FREE" ? "INGRESSO LIBERO" : event.status}
                        </div>
                        <button className="p-3 rounded-full bg-[var(--text-main)] text-[var(--bg-color)] hover:scale-110 transition-transform transform group-hover:bg-[var(--accent)]">
                          <Ticket size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--text-muted)] italic">
                    Nessun evento in programma. Contattaci per disponibilità.
                  </p>
                )}
              </div>
            </div>

            {/* CTA Booking */}
            <button
              onClick={handleBooking}
              className="w-full px-12 py-6 bg-[var(--text-main)] text-[var(--bg-color)] font-black tracking-widest hover:scale-[1.02] transition-all rounded-full text-lg shadow-xl shadow-[var(--accent)]/10"
            >
              RICHIEDI PREVENTIVO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetail;
```

---

## DIFFERENZE CHIAVE DAL TEMPLATE

| Aspetto | Template | Adattamento |
|---------|----------|-------------|
| Nome file | TalentGrid / TalentDetail | ArtistGrid / ArtistDetail |
| Dati artisti | `ARTISTS` (mock import) | `useArtists()` hook → API |
| Campo immagine | `imageUrl` | `image_url` / `hero_image_url` |
| Campo nome | `name` | `name` (alias da `title`) |
| Filtri | Solo genere + search | Genere + tipo artista + search |
| Social | instagram, spotify, twitter | instagram, spotify, facebook |
| Booking CTA | "BOOKING ENQUIRIES" | "RICHIEDI PREVENTIVO" → naviga a BOOKING |
| Date eventi | Stringa "OCT 24" | ISO 8601 formattata con `toLocaleDateString("it-IT")` |
| Stato evento | "FREE" → "FREE ENTRANCE" | "FREE" → "INGRESSO LIBERO" |
| A11y | Nessuna | `role`, `aria-label`, `tabIndex`, keyboard nav |
| Loading | Nessuno | Skeleton placeholders |
| Lingua | Inglese | Italiano |

---

## CRITERI DI ACCETTAZIONE

- [ ] ArtistGrid carica artisti da API Wagtail
- [ ] Filtro per genere funzionante (pill buttons)
- [ ] Filtro per tipo artista funzionante
- [ ] Search filtra per nome/genere
- [ ] Skeleton loading visibile durante fetch
- [ ] ArtistCard mostra immagine, nome, genere con hover effect
- [ ] ArtistCard ha `lazy loading` sulle immagini
- [ ] ArtistDetail mostra profilo completo con bio, video, eventi
- [ ] Date evento formattate in italiano (it-IT)
- [ ] "RICHIEDI PREVENTIVO" chiude detail e naviga a BOOKING
- [ ] Tutti gli elementi interattivi hanno aria-label
- [ ] "Nessun artista trovato" mostrato se filtri non matchano
