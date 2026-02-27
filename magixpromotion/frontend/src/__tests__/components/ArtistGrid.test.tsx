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

  it("filters artists by search text", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Cerca artista...");
    await user.type(searchInput, "Queen");

    // Queen Forever should appear, Groove Machine should not
    expect(screen.getByText("Queen Forever")).toBeInTheDocument();
    expect(screen.queryByText("The Groove Machine")).not.toBeInTheDocument();
  });

  it("shows empty message when no artists match search", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Cerca artista...");
    await user.type(searchInput, "zzznonexistent");

    expect(
      screen.getByText("Nessun artista trovato con questi filtri."),
    ).toBeInTheDocument();
  });

  it("calls onArtistClick when an artist card is clicked", async () => {
    const user = userEvent.setup();
    const onArtistClick = vi.fn();

    renderWithProviders(<ArtistGrid onArtistClick={onArtistClick} />);

    await waitFor(() => {
      expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
    });

    const card = screen.getByRole("button", {
      name: "Vedi dettagli di The Groove Machine",
    });
    await user.click(card);

    expect(onArtistClick).toHaveBeenCalledTimes(1);
    expect(onArtistClick).toHaveBeenCalledWith(
      expect.objectContaining({ title: "The Groove Machine" }),
    );
  });

  it("has accessible search input", () => {
    renderWithProviders(<ArtistGrid onArtistClick={() => {}} />);
    const searchInput = screen.getByLabelText("Cerca artista per nome o genere");
    expect(searchInput).toBeInTheDocument();
  });
});
