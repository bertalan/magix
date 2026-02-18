/* ===================================================================
 * Tests for src/components/BandFinder.tsx
 * =================================================================== */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BandFinder from "@/components/BandFinder";

// Mock the geminiService module
vi.mock("@/services/geminiService", () => ({
  scoutTalent: vi.fn(),
}));

// Import the mocked function for control in tests
import { scoutTalent } from "@/services/geminiService";
const mockedScoutTalent = vi.mocked(scoutTalent);

describe("BandFinder", () => {
  beforeEach(() => {
    mockedScoutTalent.mockReset();
  });

  it("renders the heading", async () => {
    render(<BandFinder onArtistSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/TROVA LA TUA/)).toBeInTheDocument();
    });
    expect(screen.getByText("BAND")).toBeInTheDocument();
  });

  it("renders the description text", async () => {
    render(<BandFinder onArtistSelect={() => {}} />);

    expect(
      screen.getByText(/Descrivi l'evento, il mood o il genere che cerchi/),
    ).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<BandFinder onArtistSelect={() => {}} />);
    expect(
      screen.getByLabelText("Descrivi la band che cerchi"),
    ).toBeInTheDocument();
  });

  it("renders suggestion buttons", async () => {
    render(<BandFinder onArtistSelect={() => {}} />);

    expect(screen.getByText("PROVA CON:")).toBeInTheDocument();
    expect(
      screen.getByText("Band energica per un matrimonio"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tributo ai Queen per un festival"),
    ).toBeInTheDocument();
  });

  it("fills search input when suggestion is clicked", async () => {
    const user = userEvent.setup();
    render(<BandFinder onArtistSelect={() => {}} />);

    const suggestion = screen.getByText("Band energica per un matrimonio");
    await user.click(suggestion);

    const input = screen.getByLabelText("Descrivi la band che cerchi");
    expect(input).toHaveValue("Band energica per un matrimonio");
  });

  it("shows loading skeleton during AI search", async () => {
    // Make scoutTalent return a pending promise
    mockedScoutTalent.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<BandFinder onArtistSelect={() => {}} />);

    // Wait for artists to load (MSW handler returns the list)
    await waitFor(() => {
      // The submit button should not be disabled since artists are loaded
    });

    const input = screen.getByLabelText("Descrivi la band che cerchi");
    await user.type(input, "Band energica");

    const form = input.closest("form")!;
    await user.click(form.querySelector("button[type='submit']")!);

    // Check for loading spinner
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
  });

  it("shows matched artist result after AI search", async () => {
    mockedScoutTalent.mockResolvedValue({
      artistId: 1,
      reasoning: "Perfetta per il tuo evento!",
      vibeScore: 9,
    });

    const user = userEvent.setup();
    render(<BandFinder onArtistSelect={() => {}} />);

    // Wait for artists to load from MSW
    await waitFor(() => {
      const submitBtn = screen.getByLabelText("Cerca con AI");
      expect(submitBtn).not.toBeDisabled();
    });

    const input = screen.getByLabelText("Descrivi la band che cerchi");
    await user.type(input, "Band energica per un matrimonio");

    const submitBtn = screen.getByLabelText("Cerca con AI");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("The Groove Machine")).toBeInTheDocument();
    });

    expect(screen.getByText(/Perfetta per il tuo evento!/)).toBeInTheDocument();
    expect(screen.getByText("9/10")).toBeInTheDocument();
    expect(screen.getByText(/VEDI PROFILO/)).toBeInTheDocument();
  });

  it("shows no match message when artist not found in pool", async () => {
    mockedScoutTalent.mockResolvedValue({
      artistId: 9999, // ID not in pool
      reasoning: "Buon match",
      vibeScore: 7,
    });

    const user = userEvent.setup();
    render(<BandFinder onArtistSelect={() => {}} />);

    await waitFor(() => {
      const submitBtn = screen.getByLabelText("Cerca con AI");
      expect(submitBtn).not.toBeDisabled();
    });

    const input = screen.getByLabelText("Descrivi la band che cerchi");
    await user.type(input, "Something random");

    const submitBtn = screen.getByLabelText("Cerca con AI");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Nessun artista trovato/),
      ).toBeInTheDocument();
    });
  });

  it("calls onArtistSelect when 'VEDI PROFILO' is clicked", async () => {
    mockedScoutTalent.mockResolvedValue({
      artistId: 1,
      reasoning: "Match perfetto!",
      vibeScore: 10,
    });

    const user = userEvent.setup();
    const onArtistSelect = vi.fn();

    render(<BandFinder onArtistSelect={onArtistSelect} />);

    await waitFor(() => {
      const submitBtn = screen.getByLabelText("Cerca con AI");
      expect(submitBtn).not.toBeDisabled();
    });

    const input = screen.getByLabelText("Descrivi la band che cerchi");
    await user.type(input, "Band energica");

    const submitBtn = screen.getByLabelText("Cerca con AI");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/VEDI PROFILO/)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/VEDI PROFILO/));

    expect(onArtistSelect).toHaveBeenCalledTimes(1);
    expect(onArtistSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, title: "The Groove Machine" }),
    );
  });

  it("does not submit with empty query", async () => {
    const user = userEvent.setup();
    render(<BandFinder onArtistSelect={() => {}} />);

    await waitFor(() => {
      const submitBtn = screen.getByLabelText("Cerca con AI");
      expect(submitBtn).not.toBeDisabled();
    });

    const submitBtn = screen.getByLabelText("Cerca con AI");
    await user.click(submitBtn);

    // scoutTalent should not have been called
    expect(mockedScoutTalent).not.toHaveBeenCalled();
  });
});
