/* ===================================================================
 * MSW mock server for Node / Vitest tests.
 * =================================================================== */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
