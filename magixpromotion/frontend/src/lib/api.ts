/* ===================================================================
 * API client for the Magix Promotion backend.
 * All requests go through the Vite dev proxy (/api -> localhost:8000).
 * =================================================================== */

import type {
  Artist,
  BookingFormData,
  EventPage,
  MenuResponse,
  SiteSettings,
  WagtailListResponse,
} from "@/types";

const API_BASE = "/api/v2";

/**
 * Generic fetcher with error handling.
 */
async function apiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// --- Artists ---

/**
 * Fetch paginated list of artists.
 */
export async function fetchArtists(params?: {
  artist_type?: string;
  genre?: string;
  region?: string;
  country?: string;
  limit?: number;
  offset?: number;
}): Promise<WagtailListResponse<Artist>> {
  const searchParams = new URLSearchParams();

  if (params?.artist_type) searchParams.set("artist_type", params.artist_type);
  if (params?.genre) searchParams.set("genre", params.genre);
  if (params?.region) searchParams.set("region", params.region);
  if (params?.country) searchParams.set("country", params.country);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));

  // Request extra fields in detail mode
  searchParams.set(
    "fields",
    "short_bio,artist_type,image_url,genre_display,tags,socials,events,tribute_to,hero_video_url,base_country,base_region,base_city",
  );

  const qs = searchParams.toString();
  return apiFetch<WagtailListResponse<Artist>>(
    `${API_BASE}/artists/?${qs}`,
  );
}

/**
 * Fetch a single artist by ID.
 */
export async function fetchArtist(id: number): Promise<Artist> {
  return apiFetch<Artist>(`${API_BASE}/artists/${id}/`);
}

// --- Events ---

/**
 * Fetch paginated list of events.
 */
export async function fetchEvents(params?: {
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
}): Promise<WagtailListResponse<EventPage>> {
  const searchParams = new URLSearchParams();

  if (params?.artist) searchParams.set("artist", params.artist);
  if (params?.venue) searchParams.set("venue", params.venue);
  if (params?.region) searchParams.set("region", params.region);
  if (params?.country) searchParams.set("country", params.country);
  if (params?.future_only) searchParams.set("future_only", "true");
  if (params?.date_from) searchParams.set("date_from", params.date_from);
  if (params?.date_to) searchParams.set("date_to", params.date_to);
  if (params?.city) searchParams.set("city", params.city);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));

  searchParams.set(
    "fields",
    "start_date,end_date,doors_time,start_time,status,ticket_url,ticket_price,description,venue,artist_name",
  );

  const qs = searchParams.toString();
  return apiFetch<WagtailListResponse<EventPage>>(
    `${API_BASE}/events/?${qs}`,
  );
}

// --- Navigation Menu ---

/**
 * Fetch menu items for a given location.
 */
export async function fetchMenu(
  location: string,
  lang: string = "it",
): Promise<MenuResponse> {
  return apiFetch<MenuResponse>(
    `${API_BASE}/menu/${location}/?lang=${lang}`,
  );
}

// --- Site Settings ---

/**
 * Fetch public site settings (company info, social links, address).
 */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  return apiFetch<SiteSettings>(`${API_BASE}/site-settings/`);
}

// --- Booking ---

/**
 * Submit a booking form request to the backend.
 */
export async function submitBooking(
  data: BookingFormData,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/booking/submit/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: (err as { detail?: string }).detail || "Errore di invio",
    };
  }

  return { success: true, message: "Richiesta inviata con successo" };
}

/**
 * Read the CSRF token from the Django csrftoken cookie.
 */
function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}
