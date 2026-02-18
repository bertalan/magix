import { useEffect, useState } from "react";
import { fetchArtists, fetchArtist } from "@/lib/api";
import type { Artist, WagtailListResponse } from "@/types";

/**
 * Hook to fetch the artist list with optional filters.
 */
export function useArtists(params?: {
  artist_type?: string;
  genre?: string;
  region?: string;
  country?: string;
  limit?: number;
  offset?: number;
}) {
  const [data, setData] = useState<WagtailListResponse<Artist> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchArtists(params)
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
    // Stringify params to use as dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { data, loading, error };
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
