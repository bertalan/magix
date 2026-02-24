import { useEffect, useState, useCallback, useRef } from "react";
import { fetchEvents } from "@/lib/api";
import type { EventPage, WagtailListResponse } from "@/types";

/** Parametri filtro eventi (senza offset/limit, gestiti internamente) */
export interface EventFilterParams {
  artist?: string;
  venue?: string;
  region?: string;
  country?: string;
  future_only?: boolean;
  date_from?: string;
  date_to?: string;
  city?: string;
}

/** Dimensione pagina per il caricamento incrementale */
const PAGE_SIZE = 6;

/**
 * Hook per caricare gli eventi con infinite scroll.
 *
 * Espone:
 * - `items`: array cumulativo di eventi
 * - `loading`: true durante il primo caricamento
 * - `loadingMore`: true durante il caricamento di pagine successive
 * - `hasMore`: true se ci sono altri eventi da caricare
 * - `totalCount`: numero totale dal backend
 * - `loadMore()`: funzione per caricare la pagina successiva
 * - `error`: eventuale errore
 */
export function useEvents(filters?: EventFilterParams) {
  const [items, setItems] = useState<EventPage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const offsetRef = useRef(0);

  const filterKey = JSON.stringify(filters ?? {});

  // Reset e primo caricamento quando cambiano i filtri
  useEffect(() => {
    let cancelled = false;
    offsetRef.current = 0;
    setItems([]);
    setLoading(true);
    setError(null);

    fetchEvents({ ...filters, limit: PAGE_SIZE, offset: 0 })
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
  }, [filterKey]);

  const hasMore = items.length < totalCount;

  /** Carica la pagina successiva (append) */
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    fetchEvents({ ...filters, limit: PAGE_SIZE, offset: offsetRef.current })
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
  }, [loadingMore, hasMore, filterKey]);

  // Retrocompatibilità: esponi anche `data` nella forma WagtailListResponse
  const data: WagtailListResponse<EventPage> | null =
    (items.length > 0 || !loading) && !error
      ? { meta: { total_count: totalCount }, items }
      : null;

  return { data, items, loading, loadingMore, error, hasMore, totalCount, loadMore };
}
