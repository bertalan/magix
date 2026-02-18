/* ===================================================================
 * Tests for src/lib/api.ts — fetchArtists, fetchEvents, submitBooking
 * =================================================================== */

import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { fetchArtists, fetchArtist, fetchEvents, fetchMenu, fetchSiteSettings, submitBooking } from "@/lib/api";
import { mockArtistsResponse, mockEventsResponse } from "../mocks/fixtures";

// ---------------------------------------------------------------
// fetchArtists
// ---------------------------------------------------------------
describe("fetchArtists", () => {
  it("returns a list of artists from the API", async () => {
    const result = await fetchArtists();
    expect(result.meta.total_count).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe("The Groove Machine");
    expect(result.items[1].title).toBe("Queen Forever");
  });

  it("sends filter params as query string", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/v2/artists/", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockArtistsResponse);
      }),
    );

    await fetchArtists({ artist_type: "tribute", genre: "Rock", limit: 10 });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("artist_type")).toBe("tribute");
    expect(url.searchParams.get("genre")).toBe("Rock");
    expect(url.searchParams.get("limit")).toBe("10");
  });

  it("throws on API error", async () => {
    server.use(
      http.get("/api/v2/artists/", () => {
        return new HttpResponse(null, { status: 500, statusText: "Internal Server Error" });
      }),
    );

    await expect(fetchArtists()).rejects.toThrow("API error 500");
  });
});

// ---------------------------------------------------------------
// fetchArtist (single)
// ---------------------------------------------------------------
describe("fetchArtist", () => {
  it("returns a single artist by ID", async () => {
    const result = await fetchArtist(1);
    expect(result.id).toBe(1);
    expect(result.title).toBe("The Groove Machine");
  });

  it("throws 404 for unknown artist", async () => {
    await expect(fetchArtist(999)).rejects.toThrow("API error 404");
  });
});

// ---------------------------------------------------------------
// fetchEvents
// ---------------------------------------------------------------
describe("fetchEvents", () => {
  it("returns a list of events from the API", async () => {
    const result = await fetchEvents();
    expect(result.meta.total_count).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe("Concerto in Piazza Duomo");
  });

  it("sends filter params as query string", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/v2/events/", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockEventsResponse);
      }),
    );

    await fetchEvents({ city: "Milano", future_only: true, limit: 5 });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("city")).toBe("Milano");
    expect(url.searchParams.get("future_only")).toBe("true");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("throws on API error", async () => {
    server.use(
      http.get("/api/v2/events/", () => {
        return new HttpResponse(null, { status: 503, statusText: "Service Unavailable" });
      }),
    );

    await expect(fetchEvents()).rejects.toThrow("API error 503");
  });
});

// ---------------------------------------------------------------
// fetchMenu
// ---------------------------------------------------------------
describe("fetchMenu", () => {
  it("returns menu items for a location", async () => {
    const result = await fetchMenu("main");
    expect(result.location).toBe("main");
    expect(result.items).toHaveLength(4);
    expect(result.items[0].title).toBe("Home");
  });
});

// ---------------------------------------------------------------
// fetchSiteSettings
// ---------------------------------------------------------------
describe("fetchSiteSettings", () => {
  it("returns site settings", async () => {
    const result = await fetchSiteSettings();
    expect(result.company_name).toBe("Magix Promotion");
    expect(result.email).toBe("info@magixpromotion.it");
  });
});

// ---------------------------------------------------------------
// submitBooking
// ---------------------------------------------------------------
describe("submitBooking", () => {
  const validBooking = {
    nome: "Mario Rossi",
    email: "mario@example.com",
    telefono: "+39 333 1234567",
    artista: "The Groove Machine",
    tipo_evento: "matrimonio",
    data_evento: "2025-09-15",
    luogo: "Milano",
    budget: "2500-5000",
    note: "Grande evento",
    privacy: true,
  };

  it("returns success on valid booking submission", async () => {
    const result = await submitBooking(validBooking);
    expect(result.success).toBe(true);
    expect(result.message).toBe("Richiesta inviata con successo");
  });

  it("returns error message on server error", async () => {
    server.use(
      http.post("/api/v2/booking/submit/", () => {
        return HttpResponse.json(
          { detail: "Email non valida" },
          { status: 400 },
        );
      }),
    );

    const result = await submitBooking(validBooking);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Email non valida");
  });

  it("returns generic error when server returns non-JSON error", async () => {
    server.use(
      http.post("/api/v2/booking/submit/", () => {
        return new HttpResponse("Server error", { status: 500 });
      }),
    );

    const result = await submitBooking(validBooking);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Errore di invio");
  });
});
