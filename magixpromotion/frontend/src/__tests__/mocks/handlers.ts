/* ===================================================================
 * MSW request handlers for Wagtail API mocks.
 * These intercept fetch requests during tests and return mock data.
 * =================================================================== */

import { http, HttpResponse } from "msw";
import {
  mockArtistsResponse,
  mockArtistSearchResult,
  mockArtistSearchResult2,
  mockEventSearchResult,
  mockEventsResponse,
  mockMenuResponse,
  mockSiteSettings,
  mockSearchResults,
  mockAutocompleteSuggestions,
} from "./fixtures";

export const handlers = [
  // --- Artists list (supports ?slug= filter) ---
  http.get("/api/v2/artists/", ({ request }) => {
    const url = new URL(request.url);
    const slugFilter = url.searchParams.get("slug");
    const artistType = url.searchParams.get("artist_type");
    const limit = Number(url.searchParams.get("limit") || mockArtistsResponse.items.length);
    const offset = Number(url.searchParams.get("offset") || 0);
    let filtered = mockArtistsResponse.items;

    if (slugFilter) {
      filtered = filtered.filter(
        (a) => a.meta.slug === slugFilter,
      );
    }

    if (artistType) {
      filtered = filtered.filter((artist) => artist.artist_type === artistType);
    }

    return HttpResponse.json({
      meta: { total_count: filtered.length },
      items: filtered.slice(offset, offset + limit),
    });
  }),

  // --- Single artist ---
  http.get("/api/v2/artists/:id/", ({ params }) => {
    const id = Number(params.id);
    const artist = mockArtistsResponse.items.find((a) => a.id === id);
    if (!artist) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(artist);
  }),

  // --- Events list (supports ?slug= filter) ---
  http.get("/api/v2/events/", ({ request }) => {
    const url = new URL(request.url);
    const slugFilter = url.searchParams.get("slug");
    if (slugFilter) {
      const filtered = mockEventsResponse.items.filter(
        (e) => e.meta.slug === slugFilter,
      );
      return HttpResponse.json({
        meta: { total_count: filtered.length },
        items: filtered,
      });
    }
    return HttpResponse.json(mockEventsResponse);
  }),

  // --- Menu ---
  http.get("/api/v2/menu/:location/", () => {
    return HttpResponse.json(mockMenuResponse);
  }),

  // --- Site Settings ---
  http.get("/api/v2/site-settings/", () => {
    return HttpResponse.json(mockSiteSettings);
  }),

  // --- Search ---
  http.get("/api/v2/search/", ({ request }) => {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") || "").trim().toLowerCase();
    const type = url.searchParams.get("type") || "all";

    if (!query || query.length < 2) {
      return HttpResponse.json({ query, total: 0, results: [] });
    }

    const artistResults = [mockArtistSearchResult, mockArtistSearchResult2];
    const eventResults = [mockEventSearchResult];
    const haystack = [
      ...(type === "all" || type === "artists" ? artistResults : []),
      ...(type === "all" || type === "events" ? eventResults : []),
    ];

    const results = haystack.filter((item) => {
      if (item.type === "artist") {
        return [item.title, item.genre, item.short_bio, item.tribute_to]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      }

      return [item.title, item.venue_name, item.city]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });

    return HttpResponse.json({
      ...mockSearchResults,
      query,
      total: results.length,
      results,
    });
  }),

  // --- Autocomplete ---
  http.get("/api/v2/search/autocomplete/", () => {
    return HttpResponse.json(mockAutocompleteSuggestions);
  }),

  // --- Booking submit (success) ---
  http.post("/api/v2/booking/submit/", async () => {
    return HttpResponse.json(
      { success: true, message: "Richiesta inviata con successo" },
      { status: 200 },
    );
  }),
];
