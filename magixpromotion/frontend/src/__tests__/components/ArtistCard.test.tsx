/* ===================================================================
 * Tests for src/components/ArtistCard.tsx
 * =================================================================== */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArtistCard from "@/components/ArtistCard";
import { mockArtist } from "../mocks/fixtures";

describe("ArtistCard", () => {
  it("renders artist title", () => {
    render(<ArtistCard artist={mockArtist} onClick={() => {}} />);
    expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
  });

  it("renders artist genre in uppercase", () => {
    render(<ArtistCard artist={mockArtist} onClick={() => {}} />);
    expect(screen.getByText("DANCE / POP")).toBeInTheDocument();
  });

  it("renders the artist image with correct alt text", () => {
    render(<ArtistCard artist={mockArtist} onClick={() => {}} />);
    const img = screen.getByAltText("The Groove Machine");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/media/images/groove-machine.jpg");
  });

  it("renders up to 2 tags in uppercase", () => {
    render(<ArtistCard artist={mockArtist} onClick={() => {}} />);
    expect(screen.getByText("MATRIMONIO")).toBeInTheDocument();
    expect(screen.getByText("FESTIVAL")).toBeInTheDocument();
    // Third tag "corporate" should not appear (only first 2)
    expect(screen.queryByText("CORPORATE")).not.toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    render(<ArtistCard artist={mockArtist} onClick={() => {}} />);
    const article = screen.getByRole("button", {
      name: "Vedi dettagli di The Groove Machine",
    });
    expect(article).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<ArtistCard artist={mockArtist} onClick={onClick} />);
    const card = screen.getByRole("button", {
      name: "Vedi dettagli di The Groove Machine",
    });
    await user.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when Enter key is pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<ArtistCard artist={mockArtist} onClick={onClick} />);
    const card = screen.getByRole("button", {
      name: "Vedi dettagli di The Groove Machine",
    });

    card.focus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders gracefully with no tags", () => {
    const artistNoTags = { ...mockArtist, tags: [] };
    render(<ArtistCard artist={artistNoTags} onClick={() => {}} />);
    expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
  });

  it("renders gracefully with null image_url", () => {
    const artistNoImage = { ...mockArtist, image_url: null };
    render(<ArtistCard artist={artistNoImage} onClick={() => {}} />);
    // Nessun tag <img> renderizzato, al suo posto un div placeholder
    expect(screen.queryByRole("img")).toBeNull();
    // La card è comunque presente e cliccabile
    expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
  });
});
