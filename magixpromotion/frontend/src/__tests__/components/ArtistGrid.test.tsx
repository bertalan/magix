/* ===================================================================
 * Tests for src/components/ArtistGrid.tsx
 * =================================================================== */

import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import ArtistGrid from "@/components/ArtistGrid";
import { renderWithProviders } from "../test-utils";
import { mockArtist2, mockArtistsResponse } from "../mocks/fixtures";

describe("ArtistGrid", () => {
  it("shows loading skeleton initially", () => {
    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);
    // Skeleton placeholders have animate-pulse class
    const container = document.querySelector(".animate-pulse");
    expect(container).not.toBeNull();
  });

  it("renders artist cards after loading", async () => {
    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
    });

    expect(screen.getByText("Queen Forever")).toBeInTheDocument();
  });

  it("renders the heading", async () => {
    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Il Nostro Roster")).toBeInTheDocument();
    });
  });

  it("shows error message on API failure", async () => {
    server.use(
      http.get("/api/v2/artists/", () => {
        return new HttpResponse(null, { status: 500, statusText: "Server Error" });
      }),
    );

    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Errore nel caricamento/)).toBeInTheDocument();
    });
  });

  it("uses the listing endpoint when the search query is empty", async () => {
    let listingHits = 0;
    let searchHits = 0;

    server.use(
      http.get("/api/v2/artists/", () => {
        listingHits += 1;
        return HttpResponse.json(mockArtistsResponse);
      }),
      http.get("/api/v2/search/", () => {
        searchHits += 1;
        return HttpResponse.json({ query: "", total: 0, results: [] });
      }),
    );

    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
    });

    expect(listingHits).toBeGreaterThan(0);
    expect(searchHits).toBe(0);
  });

  it("uses the artist search API when the query is valued", async () => {
    const user = userEvent.setup();
    let requestedType: string | null = null;

    server.use(
      http.get("/api/v2/search/", ({ request }) => {
        requestedType = new URL(request.url).searchParams.get("type");
        return HttpResponse.json({
          query: "queen",
          total: 1,
          results: [
            {
              type: "artist",
              id: 2,
              title: "Queen Forever",
              slug: "queen-tribute",
              genre: "Rock",
              genre_display: "Rock",
              image_url: "/media/images/queen-forever.jpg",
              image_thumb: "/media/images/queen-forever-thumb.jpg",
              artist_type: "tribute",
              short_bio: mockArtist2.short_bio,
              tags: mockArtist2.tags,
              tribute_to: "Queen",
              hero_video_url: "",
              base_country: mockArtist2.base_country,
              base_region: mockArtist2.base_region,
              base_city: mockArtist2.base_city,
            },
          ],
        });
      }),
    );

    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Cerca artista...");
    await user.type(searchInput, "Queen");

    await waitFor(() => {
      expect(requestedType).toBe("artists");
      expect(screen.getByText("Queen Forever")).toBeInTheDocument();
    });

    expect(screen.queryByText("The Groove Machine")).not.toBeInTheDocument();
  });

  it("shows empty message when no artists match search", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/v2/search/", () => {
        return HttpResponse.json({ query: "zzznonexistent", total: 0, results: [] });
      }),
    );

    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Cerca artista...");
    await user.type(searchInput, "zzznonexistent");

    await waitFor(() => {
      expect(
        screen.getByText("Nessun artista trovato con questi filtri."),
      ).toBeInTheDocument();
    });
  });

  it("disables classic infinite scroll while in search mode", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("/api/v2/artists/", () => {
        return HttpResponse.json({
          meta: { total_count: 8 },
          items: [mockArtistsResponse.items[0]],
        });
      }),
      http.get("/api/v2/search/", () => {
        return HttpResponse.json({
          query: "queen",
          total: 1,
          results: [
            {
              type: "artist",
              id: 2,
              title: "Queen Forever",
              slug: "queen-tribute",
              genre: "Rock",
              genre_display: "Rock",
              image_url: "/media/images/queen-forever.jpg",
              image_thumb: "/media/images/queen-forever-thumb.jpg",
              artist_type: "tribute",
              short_bio: mockArtist2.short_bio,
              tags: mockArtist2.tags,
              tribute_to: "Queen",
              hero_video_url: "",
              base_country: mockArtist2.base_country,
              base_region: mockArtist2.base_region,
              base_city: mockArtist2.base_city,
            },
          ],
        });
      }),
    );

    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Caricamento altri artisti");
      expect(screen.queryByText("Queen Forever")).not.toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Cerca artista...");
    await user.type(searchInput, "Queen");

    await waitFor(() => {
      expect(screen.getByText("Queen Forever")).toBeInTheDocument();
    });

    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "");
  });

  it("calls onArtistClick with the full artist when a search result card is clicked", async () => {
    const user = userEvent.setup();
    const onArtistClick = vi.fn();

    renderWithProviders(<ArtistGrid onArtistClick={onArtistClick} />);

    await waitFor(() => {
      expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Cerca artista...");
    await user.type(searchInput, "Queen");

    await waitFor(() => {
      expect(screen.getByText("Queen Forever")).toBeInTheDocument();
    });

    const card = screen.getByRole("button", {
      name: "Vedi dettagli di Queen Forever",
    });
    await user.click(card);

    expect(onArtistClick).toHaveBeenCalledTimes(1);
    expect(onArtistClick).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Queen Forever",
        meta: expect.objectContaining({ slug: "queen-tribute" }),
      }),
    );
  });

  it("has accessible search input", () => {
    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);
    const searchInput = screen.getByLabelText("Cerca artista per nome o genere");
    expect(searchInput).toBeInTheDocument();
  });
});
