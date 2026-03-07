import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { fetchArtists, fetchArtist } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Artist, WagtailListResponse } from "@/types";

/** Parametri filtro (senza offset/limit, gestiti internamente) */
export interface ArtistFilterParams {
  artist_type?: string;
  genre?: string;
  region?: string;
  country?: string;
  search?: string;
}

/** Dimensione pagina per il caricamento incrementale */
const PAGE_SIZE = 6;
const SEARCH_PAGE_SIZE = 50;

/** Genera la seed giornaliera in formato YYYY-MM-DD */
function todaySeed(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Hook per caricare la lista artisti con infinite scroll.
 *
 * Espone:
 * - `items`: array cumulativo di artisti
 * - `loading`: true durante il primo caricamento
 * - `loadingMore`: true durante il caricamento di pagine successive
 * - `hasMore`: true se ci sono altri artisti da caricare
 * - `totalCount`: numero totale di artisti dal backend
 * - `loadMore()`: funzione per caricare la pagina successiva
 * - `error`: eventuale errore
 */
export function useArtists(filters?: ArtistFilterParams) {
  const { lang } = useLanguage();
  const [items, setItems] = useState<Artist[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const offsetRef = useRef(0);

  // Seed giornaliera calcolata una sola volta per sessione del componente
  const seed = useMemo(() => todaySeed(), []);
  const hasSearch = Boolean(filters?.search?.trim());
  const pageSize = hasSearch ? SEARCH_PAGE_SIZE : PAGE_SIZE;

  // Chiave filtri serializzata per rilevare cambi
  const filterKey = JSON.stringify(filters ?? {});

  // Reset e primo caricamento quando cambiano i filtri
  useEffect(() => {
    let cancelled = false;
    offsetRef.current = 0;
    setItems([]);
    setLoading(true);
    setError(null);

    fetchArtists({
      ...filters,
      limit: pageSize,
      offset: 0,
      daily_seed: hasSearch ? undefined : seed,
      locale: lang,
    })
      .then((res) => {
        if (!cancelled) {
          setItems(res.items);
          setTotalCount(res.meta.total_count);
          offsetRef.current = res.items.length;
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, hasSearch, lang, pageSize, seed]);

  const hasMore = items.length < totalCount;

  /** Carica la pagina successiva (append) */
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    fetchArtists({
      ...filters,
      limit: pageSize,
      offset: offsetRef.current,
      daily_seed: hasSearch ? undefined : seed,
      locale: lang,
    })
      .then((res) => {
        setItems((prev) => [...prev, ...res.items]);
        setTotalCount(res.meta.total_count);
        offsetRef.current += res.items.length;
      })
      .catch((err: Error) => {
        setError(err);
      })
      .finally(() => {
        setLoadingMore(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, hasMore, hasSearch, lang, loadingMore, pageSize, seed]);

  // Retrocompatibilità: esponi anche `data` nella forma WagtailListResponse
  const data: WagtailListResponse<Artist> | null =
    (items.length > 0 || !loading) && !error
      ? { meta: { total_count: totalCount }, items }
      : null;

  return { data, items, loading, loadingMore, error, hasMore, totalCount, loadMore };
}

/**
 * Hook to fetch a single artist by ID.
 */
export function useArtist(id: number | null) {
  const [data, setData] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (id === null) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchArtist(id)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data, loading, error };
}
