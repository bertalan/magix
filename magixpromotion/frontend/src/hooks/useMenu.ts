import { useEffect, useState } from "react";
import { fetchMenu } from "@/lib/api";
import type { MenuResponse } from "@/types";

/**
 * Hook to fetch navigation menu items for a given location.
 */
export function useMenu(location: string, lang: string = "it") {
  const [data, setData] = useState<MenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchMenu(location, lang)
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
  }, [location, lang]);

  return { data, loading, error };
}
