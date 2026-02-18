/* ===================================================================
 * Tests for src/components/ThemeToggle.tsx
 * =================================================================== */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "@/components/ThemeToggle";

describe("ThemeToggle", () => {
  it("renders with aria-label", () => {
    render(
      <ThemeToggle currentTheme="electric-night" toggleTheme={() => {}} />,
    );

    const button = screen.getByRole("button", { name: "Cambia tema" });
    expect(button).toBeInTheDocument();
  });

  it("shows 'Tema chiaro' title when in electric-night theme", () => {
    render(
      <ThemeToggle currentTheme="electric-night" toggleTheme={() => {}} />,
    );

    const button = screen.getByRole("button", { name: "Cambia tema" });
    expect(button).toHaveAttribute("title", "Tema chiaro");
  });

  it("shows 'Tema scuro' title when in pastel-dream theme", () => {
    render(
      <ThemeToggle currentTheme="pastel-dream" toggleTheme={() => {}} />,
    );

    const button = screen.getByRole("button", { name: "Cambia tema" });
    expect(button).toHaveAttribute("title", "Tema scuro");
  });

  it("calls toggleTheme when clicked", async () => {
    const user = userEvent.setup();
    const toggleTheme = vi.fn();

    render(
      <ThemeToggle currentTheme="electric-night" toggleTheme={toggleTheme} />,
    );

    const button = screen.getByRole("button", { name: "Cambia tema" });
    await user.click(button);

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
