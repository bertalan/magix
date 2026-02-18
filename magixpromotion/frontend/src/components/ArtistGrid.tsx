import React from "react";
import { Artist } from "@/types";
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
    const p: Record<string, string | number | boolean> = { limit: 50 };
    if (filter !== "ALL") p["genre"] = filter;
    if (typeFilter !== "ALL") p["artist_type"] = typeFilter;
    return p;
  }, [filter, typeFilter]);

  const { data, loading, error } = useArtists(apiParams);
  const allArtists = data?.items || [];

  // Filtra lato client per search (la search testuale potrebbe non essere supportata dall'API)
  const artists = React.useMemo(() => {
    if (!search.trim()) return allArtists;
    const q = search.toLowerCase();
    return allArtists.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.genre_display.toLowerCase().includes(q) ||
        (a.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [allArtists, search]);

  // Estrai generi unici per filtri (da tutti gli artisti caricati)
  const genres = React.useMemo(() => {
    const set = new Set(allArtists.map((a) => a.genre_display));
    return ["ALL", ...Array.from(set).filter(Boolean).sort()];
  }, [allArtists]);

  const artistTypes = ["ALL", "show_band", "tribute", "original", "dj", "cover"];

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
            <div
              key={i}
              className="aspect-[3/4] rounded-3xl bg-[var(--glass)] animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-24 text-rose-500">
          <p>Errore nel caricamento: {error.message}</p>
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
              <p className="text-xl">
                Nessun artista trovato con questi filtri.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtistGrid;
