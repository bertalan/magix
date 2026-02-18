/* ===================================================================
 * Test setup file for Vitest.
 * - Imports jest-dom matchers for DOM assertions
 * - Starts/stops MSW mock server around tests
 * =================================================================== */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Reset handlers & cleanup DOM after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close MSW server after all tests
afterAll(() => {
  server.close();
});
