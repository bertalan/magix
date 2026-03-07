import React from "react";
import { Artist, ArtistSearchResult } from "@/types";
import { useArtists } from "@/hooks/useArtists";
import { useArtistSearch } from "@/hooks/useSearch";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchArtist } from "@/lib/api";
import ArtistCard from "./ArtistCard";
import ArtistFilters from "./ArtistFilters";
import SEOHead from "./SEOHead";
import { RosterJsonLd } from "./JsonLdScript";

interface ArtistGridProps {
  onArtistClick: (artist: Artist) => void;
}

function mapSearchArtistToArtist(result: ArtistSearchResult): Artist {
  return {
    id: result.id,
    meta: {
      type: "artists.ArtistPage",
      detail_url: `/api/v2/artists/${result.id}/`,
      html_url: `/artisti/${result.slug}/`,
      slug: result.slug,
      first_published_at: null,
    },
    title: result.title,
    short_bio: result.short_bio ?? "",
    artist_type: result.artist_type ?? "show_band",
    tribute_to: result.tribute_to ?? "",
    hero_video_url: result.hero_video_url ?? "",
    base_country: result.base_country ?? "",
    base_region: result.base_region ?? "",
    base_city: result.base_city ?? "",
    image_url: result.image_url ?? null,
    image_thumb: result.image_thumb ?? result.image_url ?? null,
    gallery_images: [],
    gallery_thumbs: [],
    genre_display: result.genre_display ?? result.genre ?? "",
    tags: result.tags ?? [],
    socials: {
      instagram: null,
      spotify: null,
      facebook: null,
      website: null,
    },
    events: [],
    epk: null,
    body_html: "",
  };
}

const ArtistGrid: React.FC<ArtistGridProps> = ({ onArtistClick }) => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("search") || "";
    // Pulisci il parametro dall'URL per evitare che persista nei link futuri
    if (q) {
      const url = new URL(window.location.href);
      url.searchParams.delete("search");
      window.history.replaceState(null, "", url.pathname);
    }
    return q;
  });
  const [typeFilter, setTypeFilter] = React.useState("ALL");

  // Debounce della search per non bombardare l'API ad ogni keystroke
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Costruisci parametri filtro per API (senza limit/offset — gestiti dal hook)
  const apiFilters = React.useMemo(() => {
    const p: Record<string, string> = {};
    if (typeFilter !== "ALL") p["artist_type"] = typeFilter;
    return p;
  }, [typeFilter]);

  const { items: allArtists, loading, loadingMore, error, hasMore, loadMore, totalCount } =
    useArtists(apiFilters);

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    total: searchTotal,
    search: searchArtists,
    clearResults,
  } = useArtistSearch(0);

  React.useEffect(() => {
    if (!debouncedSearch) {
      clearResults();
      return;
    }

    void searchArtists(debouncedSearch, lang);
  }, [clearResults, debouncedSearch, lang, searchArtists]);

  const isSearching = debouncedSearch.length > 0;
  const filteredSearchResults = React.useMemo(
    () => searchResults.filter((artist) => (
      typeFilter === "ALL" ? true : artist.artist_type === typeFilter
    )),
    [searchResults, typeFilter],
  );
  const searchArtistsForCards = React.useMemo(
    () => filteredSearchResults.map(mapSearchArtistToArtist),
    [filteredSearchResults],
  );
  const artists = isSearching ? searchArtistsForCards : allArtists;
  const activeLoading = isSearching ? searchLoading : loading;
  const activeError = isSearching ? searchError : error;
  const activeTotalCount = isSearching
    ? (typeFilter === "ALL" ? searchTotal : filteredSearchResults.length)
    : totalCount;

  const scrollDisabled = loading || loadingMore || !hasMore || isSearching;
  const sentinelRef = useInfiniteScroll(loadMore, scrollDisabled);

  const handleArtistCardClick = React.useCallback(
    async (artist: Artist) => {
      if (!isSearching) {
        onArtistClick(artist);
        return;
      }

      try {
        const fullArtist = await fetchArtist(artist.id);
        onArtistClick(fullArtist);
      } catch {
        onArtistClick(artist);
      }
    },
    [isSearching, onArtistClick],
  );

  // Estrai generi unici per filtri (da tutti gli artisti caricati)
  const artistTypes = ["ALL", "show_band", "tribute", "cover", "dj", "original"];

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <SEOHead
        title={t("artists.pageTitle")}
        description={t("artists.pageDescription")}
        type="website"
      />
      {/* SEO: JSON-LD ItemList per il roster */}
      <RosterJsonLd lang={lang} />

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
      {!activeLoading && activeTotalCount > 0 && (
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {isSearching
            ? t("artists.results", { count: activeTotalCount })
            : t("artists.countOf", { loaded: artists.length, total: activeTotalCount })}
        </p>
      )}

      {/* Skeleton caricamento iniziale */}
      {activeLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-3xl bg-[var(--glass)] animate-pulse"
            />
          ))}
        </div>
      )}

      {activeError && (
        <div className="text-center py-24 text-rose-500">
          <p>{t("artists.loadError")}: {activeError.message}</p>
        </div>
      )}

      {/* Grid */}
      {!activeLoading && !activeError && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {artists.length > 0 ? (
              artists.map((artist, idx) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  onClick={() => void handleArtistCardClick(artist)}
                  priority={idx < 3}
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
          {!isSearching && loadingMore && (
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
            aria-label={!isSearching && hasMore ? t("artists.loadingMore") : ""}
          />
        </>
      )}
    </div>
  );
};

export default ArtistGrid;
