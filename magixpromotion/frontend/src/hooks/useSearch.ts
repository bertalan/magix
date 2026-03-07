import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type {
  ArtistSearchResult,
  AutocompleteSuggestion,
  SearchResponse,
  SearchResult,
} from "@/types";

interface UseSearchReturn {
  results: SearchResult[];
  suggestions: AutocompleteSuggestion[];
  loading: boolean;
  error: Error | null;
  total: number;
  search: (query: string, type?: string) => Promise<void>;
  autocomplete: (query: string) => Promise<void>;
  clearResults: () => void;
}

interface UseArtistSearchReturn {
  results: ArtistSearchResult[];
  loading: boolean;
  error: Error | null;
  total: number;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
}

/**
 * Hook per ricerca full-text con debounce.
 *
 * Fornisce:
 * - search(query, type) per ricerca completa
 * - autocomplete(query) per suggerimenti rapidi
 * - Debounce integrato (300ms default)
 * - Minimo 2 caratteri per attivare la ricerca
 */
export function useSearch(debounceMs = 300): UseSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const search = useCallback(
    async (query: string, type = "all") => {
      if (query.length < 2) {
        setResults([]);
        setTotal(0);
        setError(null);
        return Promise.resolve();
      }

      // Cancel any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      return new Promise<void>((resolve) => {
        debounceRef.current = setTimeout(async () => {
          setLoading(true);
          try {
            const res = await fetch(
              `/api/v2/search/?q=${encodeURIComponent(query)}&type=${type}`
            );
            if (!res.ok) {
              throw new Error(`API error ${res.status}: ${res.statusText}`);
            }
            const data = await res.json() as SearchResponse;
            setResults(data.results);
            setTotal(data.total ?? data.results.length);
            setError(null);
          } catch (err) {
            setResults([]);
            setTotal(0);
            setError(err instanceof Error ? err : new Error("Search failed"));
          } finally {
            setLoading(false);
            resolve();
          }
        }, debounceMs);
      });
    },
    [debounceMs]
  );

  const autocomplete = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return Promise.resolve();
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      return new Promise<void>((resolve) => {
        debounceRef.current = setTimeout(async () => {
          try {
            const res = await fetch(
              `/api/v2/search/autocomplete/?q=${encodeURIComponent(query)}`
            );
            if (!res.ok) {
              throw new Error(`API error ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setSuggestions(data.suggestions);
            setError(null);
          } catch {
            setSuggestions([]);
          } finally {
            resolve();
          }
        }, debounceMs);
      });
    },
    [debounceMs]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setSuggestions([]);
    setTotal(0);
    setError(null);
  }, []);

  return { results, suggestions, loading, error, total, search, autocomplete, clearResults };
}

export function useArtistSearch(debounceMs = 300): UseArtistSearchReturn {
  const { results, loading, error, total, search, clearResults } = useSearch(debounceMs);

  const artistResults = useMemo(
    () => results.filter((result): result is ArtistSearchResult => result.type === "artist"),
    [results],
  );

  const searchArtists = useCallback(
    async (query: string) => search(query, "artists"),
    [search],
  );

  return {
    results: artistResults,
    loading,
    error,
    total,
    search: searchArtists,
    clearResults,
  };
}
