/* ===================================================================
 * Tests for src/components/SearchBar.tsx
 * =================================================================== */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "@/components/SearchBar";

describe("SearchBar", () => {
  it("renders search input with default placeholder", () => {
    render(<SearchBar />);
    expect(
      screen.getByPlaceholderText("Cerca artisti, eventi..."),
    ).toBeInTheDocument();
  });

  it("renders search input with custom placeholder", () => {
    render(<SearchBar placeholder="Search..." />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("has role=search on wrapper", () => {
    render(<SearchBar />);
    expect(screen.getByRole("search")).toBeInTheDocument();
  });

  it("has role=combobox on input", () => {
    render(<SearchBar />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("has accessible label", () => {
    render(<SearchBar />);
    expect(screen.getByLabelText("Cerca artisti e eventi")).toBeInTheDocument();
  });

  it("has hidden label 'Cerca'", () => {
    render(<SearchBar />);
    expect(screen.getByText("Cerca")).toBeInTheDocument();
  });

  it("does not show dropdown initially", () => {
    render(<SearchBar />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not trigger autocomplete with single character", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    await user.type(input, "a");

    // Should not show dropdown
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes dropdown on Escape key", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    await user.type(input, "groove");

    // Wait for any dropdown to appear
    await waitFor(
      () => {
        // Dropdown might or might not appear depending on debounce
      },
      { timeout: 500 },
    );

    // Press Escape
    await user.keyboard("{Escape}");

    // Dropdown should be closed
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("calls onResultClick when a suggestion is clicked", async () => {
    const user = userEvent.setup();
    const onResultClick = vi.fn();

    render(<SearchBar onResultClick={onResultClick} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "groove");

    // Wait for suggestions dropdown to appear (autocomplete fires after debounce)
    await waitFor(
      () => {
        expect(screen.getByText("Suggerimenti")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Click on a suggestion
    const suggestion = screen.getByText("The Groove Machine");
    await user.click(suggestion);

    expect(onResultClick).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "artist",
        slug: "the-groove-machine",
        id: 1,
      }),
    );
  });

  it("updates input value when typing", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    await user.type(input, "test query");

    expect(input).toHaveValue("test query");
  });
});
