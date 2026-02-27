/* ===================================================================
 * Tests for src/components/ThemeToggle.tsx
 * =================================================================== */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "@/components/ThemeToggle";
import { renderWithProviders } from "../test-utils";

describe("ThemeToggle", () => {
  it("renders with aria-label", () => {
    renderWithProviders(
      <ThemeToggle currentTheme="electric-night" toggleTheme={() => {}} />,
    );

    const button = screen.getByRole("button", { name: "Passa al tema chiaro" });
    expect(button).toBeInTheDocument();
  });

  it("shows 'Tema chiaro' title when in electric-night theme", () => {
    renderWithProviders(
      <ThemeToggle currentTheme="electric-night" toggleTheme={() => {}} />,
    );

    const button = screen.getByRole("button", { name: "Passa al tema chiaro" });
    expect(button).toHaveAttribute("title", "Passa al tema chiaro");
  });

  it("shows 'Tema scuro' title when in pastel-dream theme", () => {
    renderWithProviders(
      <ThemeToggle currentTheme="pastel-dream" toggleTheme={() => {}} />,
    );

    const button = screen.getByRole("button", { name: "Passa al tema scuro" });
    expect(button).toHaveAttribute("title", "Passa al tema scuro");
  });

  it("calls toggleTheme when clicked", async () => {
    const user = userEvent.setup();
    const toggleTheme = vi.fn();

    renderWithProviders(
      <ThemeToggle currentTheme="electric-night" toggleTheme={toggleTheme} />,
    );

    const button = screen.getByRole("button", { name: "Passa al tema chiaro" });
    await user.click(button);

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
