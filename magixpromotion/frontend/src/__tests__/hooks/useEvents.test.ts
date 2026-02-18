/* ===================================================================
 * Tests for src/hooks/useEvents.ts
 * =================================================================== */

import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { useEvents } from "@/hooks/useEvents";

describe("useEvents", () => {
  it("fetches events and returns data", async () => {
    const { result } = renderHook(() => useEvents());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.items).toHaveLength(2);
    expect(result.current.data!.items[0].title).toBe("Concerto in Piazza Duomo");
    expect(result.current.error).toBeNull();
  });

  it("passes filter params to the API", async () => {
    const { result } = renderHook(() =>
      useEvents({ city: "Milano", future_only: true }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
  });

  it("sets error on API failure", async () => {
    server.use(
      http.get("/api/v2/events/", () => {
        return new HttpResponse(null, { status: 500, statusText: "Server Error" });
      }),
    );

    const { result } = renderHook(() => useEvents());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeNull();
  });
});
