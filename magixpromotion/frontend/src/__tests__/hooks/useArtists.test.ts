/* ===================================================================
 * Tests for src/hooks/useArtists.ts
 * =================================================================== */

import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { useArtists, useArtist } from "@/hooks/useArtists";

describe("useArtists", () => {
  it("fetches artists and returns data", async () => {
    const { result } = renderHook(() => useArtists());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    // Wait for data
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.items).toHaveLength(2);
    expect(result.current.data!.items[0].title).toBe("The Groove Machine");
    expect(result.current.error).toBeNull();
  });

  it("passes filter params to the API", async () => {
    const { result } = renderHook(() =>
      useArtists({ artist_type: "tribute" }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
  });

  it("sets error on API failure", async () => {
    server.use(
      http.get("/api/v2/artists/", () => {
        return new HttpResponse(null, { status: 500, statusText: "Internal Server Error" });
      }),
    );

    const { result } = renderHook(() => useArtists());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error!.message).toContain("500");
    expect(result.current.data).toBeNull();
  });
});

describe("useArtist", () => {
  it("fetches a single artist by ID", async () => {
    const { result } = renderHook(() => useArtist(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.title).toBe("The Groove Machine");
    expect(result.current.error).toBeNull();
  });

  it("does nothing when id is null", async () => {
    const { result } = renderHook(() => useArtist(null));

    // Should not be loading since id is null
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("sets error when artist not found", async () => {
    const { result } = renderHook(() => useArtist(999));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
  });
});
