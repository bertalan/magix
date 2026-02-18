/* ===================================================================
 * Tests for src/hooks/useMenu.ts
 * =================================================================== */

import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { useMenu } from "@/hooks/useMenu";

describe("useMenu", () => {
  it("fetches menu items for a location", async () => {
    const { result } = renderHook(() => useMenu("main"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.location).toBe("main");
    expect(result.current.data!.items).toHaveLength(4);
    expect(result.current.data!.items[0].title).toBe("Home");
    expect(result.current.error).toBeNull();
  });

  it("fetches with custom language", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/v2/menu/:location/", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          location: "main",
          language: "en",
          items: [],
        });
      }),
    );

    const { result } = renderHook(() => useMenu("main", "en"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(capturedUrl).toContain("lang=en");
  });

  it("sets error on API failure", async () => {
    server.use(
      http.get("/api/v2/menu/:location/", () => {
        return new HttpResponse(null, { status: 500, statusText: "Error" });
      }),
    );

    const { result } = renderHook(() => useMenu("main"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeNull();
  });
});
