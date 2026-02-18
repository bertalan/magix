/* ===================================================================
 * MSW request handlers for Wagtail API mocks.
 * These intercept fetch requests during tests and return mock data.
 * =================================================================== */

import { http, HttpResponse } from "msw";
import {
  mockArtistsResponse,
  mockEventsResponse,
  mockMenuResponse,
  mockSiteSettings,
  mockSearchResults,
  mockAutocompleteSuggestions,
} from "./fixtures";

export const handlers = [
  // --- Artists list ---
  http.get("/api/v2/artists/", () => {
    return HttpResponse.json(mockArtistsResponse);
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

  // --- Events list ---
  http.get("/api/v2/events/", () => {
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
  http.get("/api/v2/search/", () => {
    return HttpResponse.json(mockSearchResults);
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
