import React from "react";
import { Artist } from "@/types";
import { useArtists } from "@/hooks/useArtists";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useLanguage } from "@/contexts/LanguageContext";
import ArtistCard from "./ArtistCard";
import ArtistFilters from "./ArtistFilters";
import { RosterJsonLd } from "./JsonLdScript";

interface ArtistGridProps {
  onArtistClick: (artist: Artist) => void;
}

const ArtistGrid: React.FC<ArtistGridProps> = ({ onArtistClick }) => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");

  // Costruisci parametri filtro per API (senza limit/offset — gestiti dal hook)
  const apiFilters = React.useMemo(() => {
    const p: Record<string, string> = {};
    if (typeFilter !== "ALL") p["artist_type"] = typeFilter;
    return p;
  }, [typeFilter]);

  const { items: allArtists, loading, loadingMore, error, hasMore, loadMore, totalCount } =
    useArtists(apiFilters);

  // Filtra lato client per search testuale
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

  // Disabilita infinite scroll quando c'è una ricerca testuale attiva
  // (la search filtra lato client, quindi non serve caricare nuove pagine)
  const scrollDisabled = loading || loadingMore || !hasMore || search.trim().length > 0;
  const sentinelRef = useInfiniteScroll(loadMore, scrollDisabled);

  // Estrai generi unici per filtri (da tutti gli artisti caricati)
  const artistTypes = ["ALL", "show_band", "tribute", "original", "dj", "cover"];

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      {/* SEO: JSON-LD ItemList per il roster */}
      <RosterJsonLd artists={allArtists} totalCount={totalCount} lang={lang} />

      {/* Header con titolo e filtri */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
        <div>
          <h2 className="text-4xl md:text-6xl font-heading font-extrabold mb-4 tracking-tight text-[var(--text-main)] uppercase">
            {t("artists.rosterTitle")}
          </h2>
          <ArtistFilters
            artistTypes={artistTypes}
            activeType={typeFilter}
            onTypeChange={setTypeFilter}
          />
        </div>

        {/* Search */}
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder={t("artists.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--glass)] border border-[var(--glass-border)] px-6 py-3 rounded-full text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent)]/50 transition-all"
            aria-label={t("artists.searchAria")}
          />
        </div>
      </div>

      {/* Conteggio risultati */}
      {!loading && totalCount > 0 && (
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {search.trim()
            ? t("artists.results", { count: artists.length })
            : t("artists.countOf", { loaded: allArtists.length, total: totalCount })}
        </p>
      )}

      {/* Skeleton caricamento iniziale */}
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
          <p>{t("artists.loadError")}: {error.message}</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <>
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
                  {t("artists.noResults")}
                </p>
              </div>
            )}
          </div>

          {/* Skeleton per caricamento pagine successive */}
          {loadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mt-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`more-${i}`}
                  className="aspect-[3/4] rounded-3xl bg-[var(--glass)] animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Sentinella Intersection Observer per infinite scroll */}
          <div
            ref={sentinelRef}
            className="h-4"
            role="status"
            aria-label={hasMore ? t("artists.loadingMore") : ""}
          />
        </>
      )}
    </div>
  );
};

export default ArtistGrid;
