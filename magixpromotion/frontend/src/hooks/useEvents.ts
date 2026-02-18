import { useEffect, useState } from "react";
import { fetchEvents } from "@/lib/api";
import type { EventPage, WagtailListResponse } from "@/types";

/**
 * Hook to fetch events with optional filters.
 */
export function useEvents(params?: {
  artist?: string;
  venue?: string;
  region?: string;
  country?: string;
  future_only?: boolean;
  date_from?: string;
  date_to?: string;
  city?: string;
  limit?: number;
  offset?: number;
}) {
  const [data, setData] = useState<WagtailListResponse<EventPage> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchEvents(params)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { data, loading, error };
}
