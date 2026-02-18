/* ===================================================================
 * Tests for src/hooks/useSearch.ts
 * =================================================================== */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearch } from "@/hooks/useSearch";

describe("useSearch", () => {
  it("initializes with empty state", () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.results).toEqual([]);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("does not search with query shorter than 2 characters", async () => {
    const { result } = renderHook(() => useSearch(0)); // 0ms debounce

    await act(async () => {
      await result.current.search("a");
    });

    expect(result.current.results).toEqual([]);
  });

  it("performs search with debounce and returns results", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSearch(100));

    let searchPromise: Promise<void> | undefined;
    act(() => {
      searchPromise = result.current.search("groove");
    });

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    await act(async () => {
      await searchPromise;
    });

    expect(result.current.results.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it("autocomplete does not search with short query", async () => {
    const { result } = renderHook(() => useSearch(0));

    await act(async () => {
      await result.current.autocomplete("a");
    });

    expect(result.current.suggestions).toEqual([]);
  });

  it("autocomplete returns suggestions with valid query", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSearch(100));

    let autocompletePromise: Promise<void> | undefined;
    act(() => {
      autocompletePromise = result.current.autocomplete("groove");
    });

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    await act(async () => {
      await autocompletePromise;
    });

    expect(result.current.suggestions.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it("clearResults resets both results and suggestions", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSearch(50));

    // Trigger a search first
    let searchPromise: Promise<void> | undefined;
    act(() => {
      searchPromise = result.current.search("groove");
    });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {
      await searchPromise;
    });

    // Now clear
    act(() => {
      result.current.clearResults();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.suggestions).toEqual([]);
    vi.useRealTimers();
  });
});
