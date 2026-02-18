export interface ScoutResult {
  artistId: number;
  reasoning: string;
  vibeScore: number;
}

/**
 * Read the CSRF token from the Django csrftoken cookie.
 */
function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}

/**
 * Call the backend BandFinder proxy instead of Gemini directly.
 * The API key is kept server-side — no secrets in the browser.
 */
export const scoutTalent = async (
  query: string,
  artistPool: Array<{
    id: number;
    name: string;
    genre: string;
    bio: string;
    artist_type: string;
    tags: string[];
  }>,
): Promise<ScoutResult | null> => {
  try {
    const res = await fetch("/api/v2/band-finder/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
      },
      body: JSON.stringify({
        query,
        artist_pool: artistPool,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("BandFinder API error:", (err as { detail?: string }).detail || res.statusText);
      return null;
    }

    return (await res.json()) as ScoutResult;
  } catch (error) {
    console.error("Errore BandFinder:", error);
    return null;
  }
};
