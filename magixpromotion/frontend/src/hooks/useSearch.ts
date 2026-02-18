import { useState, useCallback, useRef, useEffect } from "react";

interface SearchResult {
  type: "artist" | "event";
  id: number;
  title: string;
  slug: string;
  genre?: string;
  image_url?: string;
  start_date?: string;
  venue_name?: string;
  city?: string;
}

interface AutocompleteSuggestion {
  id: number;
  name: string;
  slug: string;
  genre?: string;
}

interface UseSearchReturn {
  results: SearchResult[];
  suggestions: AutocompleteSuggestion[];
  loading: boolean;
  search: (query: string, type?: string) => Promise<void>;
  autocomplete: (query: string) => Promise<void>;
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
        return;
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
            const data = await res.json();
            setResults(data.results);
          } catch {
            setResults([]);
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
        return;
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
            const data = await res.json();
            setSuggestions(data.suggestions);
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
  }, []);

  return { results, suggestions, loading, search, autocomplete, clearResults };
}
