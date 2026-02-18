# TASK 25 — Testing Frontend (Vitest + RTL + MSW)

> **Agente:** Frontend  
> **Fase:** 6 — Testing & Deploy  
> **Dipendenze:** Task 13-19 (frontend completato)  
> **Stima:** 35 min  

---

## OBIETTIVO

Creare una test suite completa per il frontend React con:
1. Vitest — test runner compatibile Vite
2. React Testing Library — test componenti
3. MSW (Mock Service Worker) — mock API Wagtail
4. jest-axe — test accessibilità automatizzati

---

## FILES_IN_SCOPE (da leggere)

- `template-strutturale/types.ts` — Interfacce TypeScript
- `template-strutturale/components/` — Componenti da testare

---

## OUTPUT_ATTESO

```
frontend/
├── vitest.config.ts
├── src/
│   ├── test/
│   │   ├── setup.ts           # Setup globale (MSW, jest-dom)
│   │   ├── mocks/
│   │   │   ├── handlers.ts    # MSW handlers per API Wagtail
│   │   │   └── server.ts      # MSW server node
│   │   ├── fixtures/
│   │   │   ├── artists.ts     # Mock data artisti
│   │   │   └── events.ts      # Mock data eventi
│   │   └── utils.tsx          # Render helper con provider
│   └── components/
│       └── __tests__/
│           ├── Header.test.tsx
│           ├── ArtistCard.test.tsx
│           ├── ArtistGrid.test.tsx
│           ├── ArtistDetail.test.tsx
│           ├── EventCard.test.tsx
│           ├── BookingForm.test.tsx
│           ├── BandFinder.test.tsx
│           └── HomePage.test.tsx
```

---

## SPECIFICHE

### 1. Dipendenze dev (aggiungi a package.json devDependencies)

```json
{
  "vitest": "^3.0.0",
  "@testing-library/react": "^16.0.0",
  "@testing-library/jest-dom": "^6.6.0",
  "@testing-library/user-event": "^14.5.0",
  "msw": "^2.6.0",
  "jest-axe": "^9.0.0",
  "jsdom": "^25.0.0",
  "@types/jest-axe": "^3.9.0"
}
```

### 2. vitest.config.ts

```typescript
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/components/**"],
      exclude: ["src/test/**"],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});
```

### 3. src/test/setup.ts

```typescript
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

// Avvia MSW prima di tutti i test
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers dopo ogni test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Chiudi MSW dopo tutti i test
afterAll(() => server.close());
```

### 4. src/test/mocks/server.ts

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

### 5. src/test/mocks/handlers.ts

```typescript
import { http, HttpResponse } from "msw";
import { mockArtists } from "../fixtures/artists";
import { mockEvents } from "../fixtures/events";

const API_BASE = "/api/v2";

export const handlers = [
  // Lista artisti
  http.get(`${API_BASE}/pages/`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    if (type === "artists.ArtistPage") {
      const genre = url.searchParams.get("genre");
      let items = mockArtists;
      if (genre) {
        items = items.filter((a) =>
          a.genres.some((g) => g.slug === genre)
        );
      }
      return HttpResponse.json({
        meta: { total_count: items.length },
        items,
      });
    }

    if (type === "events.EventPage") {
      return HttpResponse.json({
        meta: { total_count: mockEvents.length },
        items: mockEvents,
      });
    }

    return HttpResponse.json({ meta: { total_count: 0 }, items: [] });
  }),

  // Singolo artista
  http.get(`${API_BASE}/pages/:id/`, ({ params }) => {
    const artist = mockArtists.find((a) => a.id === Number(params.id));
    if (artist) return HttpResponse.json(artist);
    return new HttpResponse(null, { status: 404 });
  }),

  // Menu
  http.get(`${API_BASE}/menu/:slug/`, () => {
    return HttpResponse.json({
      items: [
        { label: "Home", url: "/", icon: "home", open_in_new_tab: false },
        { label: "Artisti", url: "/artisti/", icon: "music", open_in_new_tab: false },
        { label: "Eventi", url: "/eventi/", icon: "calendar", open_in_new_tab: false },
      ],
    });
  }),

  // Booking
  http.post(`${API_BASE}/booking/submit/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.email) {
      return HttpResponse.json(
        { errors: { email: ["Campo obbligatorio"] } },
        { status: 400 }
      );
    }
    return HttpResponse.json({ status: "ok", id: 42 }, { status: 201 });
  }),

  // Search
  http.get(`${API_BASE}/search/`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    if (q.length < 2) {
      return HttpResponse.json({ results: [] });
    }
    const results = mockArtists
      .filter((a) => a.title.toLowerCase().includes(q.toLowerCase()))
      .map((a) => ({ id: a.id, title: a.title, type: "artist" }));
    return HttpResponse.json({ results });
  }),
];
```

### 6. src/test/fixtures/artists.ts

```typescript
import type { Artist } from "../../types";

export const mockArtists: Artist[] = [
  {
    id: 1,
    title: "Red Moon",
    slug: "red-moon",
    bio: "Red Moon è una dance show band di Milano.",
    artist_type: "band",
    image_url: "/media/images/red-moon.jpg",
    hero_image_url: "/media/images/red-moon-hero.jpg",
    hero_video_url: "https://youtube.com/watch?v=test1",
    genres: [{ name: "Dance Show Band", slug: "dance-show-band" }],
    members_count: 6,
    social_links: { instagram: "https://instagram.com/redmoon" },
    upcoming_events: [],
  },
  {
    id: 2,
    title: "iPop",
    slug: "ipop",
    bio: "iPop è la festa definitiva.",
    artist_type: "band",
    image_url: "/media/images/ipop.jpg",
    hero_image_url: "/media/images/ipop-hero.jpg",
    hero_video_url: "",
    genres: [{ name: "Dance Show Band", slug: "dance-show-band" }],
    members_count: 8,
    social_links: {},
    upcoming_events: [],
  },
  {
    id: 3,
    title: "Abba Tribute",
    slug: "abba-tribute",
    bio: "Tributo ufficiale agli ABBA.",
    artist_type: "tribute",
    image_url: "/media/images/abba.jpg",
    hero_image_url: "/media/images/abba-hero.jpg",
    hero_video_url: "",
    genres: [{ name: "Tributo Internazionale", slug: "tributo-internazionale" }],
    members_count: 4,
    social_links: {},
    upcoming_events: [],
  },
];
```

### 7. src/test/fixtures/events.ts

```typescript
import type { MusicEvent } from "../../types";

export const mockEvents: MusicEvent[] = [
  {
    id: 101,
    title: "Red Moon @ Festa della Birra",
    slug: "red-moon-festa-birra",
    date_start: "2025-08-15",
    date_end: "2025-08-15",
    city: "Bergamo",
    venue_name: "Piazza Vecchia",
    status: "confirmed",
    is_archived: false,
    artist: { id: 1, title: "Red Moon", slug: "red-moon" },
  },
  {
    id: 102,
    title: "iPop @ Notte Bianca",
    slug: "ipop-notte-bianca",
    date_start: "2025-09-20",
    date_end: "2025-09-20",
    city: "Como",
    venue_name: "Piazza Duomo",
    status: "confirmed",
    is_archived: false,
    artist: { id: 2, title: "iPop", slug: "ipop" },
  },
  {
    id: 103,
    title: "Abba Tribute @ Vintage Festival",
    slug: "abba-vintage",
    date_start: "2025-06-01",
    date_end: "2025-06-01",
    city: "Milano",
    venue_name: "Alcatraz",
    status: "confirmed",
    is_archived: true,
    artist: { id: 3, title: "Abba Tribute", slug: "abba-tribute" },
  },
];
```

### 8. src/test/utils.tsx — Render helper

```tsx
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Custom render con eventuali provider globali.
 * Estendere qui se si aggiungono context (Theme, Auth, ecc.).
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { ...options });
}

export * from "@testing-library/react";
export { customRender as render };
```

### 9. Header.test.tsx

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, within } from "../../test/utils";
import { Header } from "../Header";

describe("Header", () => {
  it("renderizza il logo Magix Promotion", () => {
    render(<Header />);
    expect(screen.getByText(/magix/i)).toBeInTheDocument();
  });

  it("mostra le voci di navigazione", async () => {
    render(<Header />);
    const nav = await screen.findByRole("navigation");
    expect(within(nav).getByText(/artisti/i)).toBeInTheDocument();
    expect(within(nav).getByText(/eventi/i)).toBeInTheDocument();
  });

  it("ha il toggle tema accessibile", () => {
    render(<Header />);
    const toggle = screen.getByRole("button", { name: /tema/i });
    expect(toggle).toBeInTheDocument();
  });
});
```

### 10. ArtistCard.test.tsx

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test/utils";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { ArtistCard } from "../ArtistCard";
import { mockArtists } from "../../test/fixtures/artists";

expect.extend(toHaveNoViolations);

const artist = mockArtists[0];

describe("ArtistCard", () => {
  it("renderizza nome artista e genere", () => {
    render(<ArtistCard artist={artist} onSelect={vi.fn()} />);
    expect(screen.getByText("Red Moon")).toBeInTheDocument();
    expect(screen.getByText("Dance Show Band")).toBeInTheDocument();
  });

  it("chiama onSelect al click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ArtistCard artist={artist} onSelect={onSelect} />);

    await user.click(screen.getByRole("article"));
    expect(onSelect).toHaveBeenCalledWith(artist);
  });

  it("chiama onSelect con Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ArtistCard artist={artist} onSelect={onSelect} />);

    const card = screen.getByRole("article");
    card.focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalled();
  });

  it("immagine ha alt text significativo", () => {
    render(<ArtistCard artist={artist} onSelect={vi.fn()} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", expect.stringContaining("Red Moon"));
  });

  it("non ha violazioni a11y", async () => {
    const { container } = render(
      <ArtistCard artist={artist} onSelect={vi.fn()} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 11. ArtistGrid.test.tsx

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "../../test/utils";
import userEvent from "@testing-library/user-event";
import { ArtistGrid } from "../ArtistGrid";

describe("ArtistGrid", () => {
  it("carica e mostra gli artisti dalla API", async () => {
    render(<ArtistGrid onSelectArtist={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Red Moon")).toBeInTheDocument();
      expect(screen.getByText("iPop")).toBeInTheDocument();
    });
  });

  it("mostra skeleton loader durante il caricamento", () => {
    render(<ArtistGrid onSelectArtist={() => {}} />);
    expect(screen.getAllByTestId("skeleton-card").length).toBeGreaterThan(0);
  });

  it("filtra per genere", async () => {
    const user = userEvent.setup();
    render(<ArtistGrid onSelectArtist={() => {}} />);

    await screen.findByText("Red Moon");
    const genreFilter = screen.getByRole("combobox", { name: /genere/i });
    await user.selectOptions(genreFilter, "tributo-internazionale");

    await waitFor(() => {
      expect(screen.getByText("Abba Tribute")).toBeInTheDocument();
      expect(screen.queryByText("Red Moon")).not.toBeInTheDocument();
    });
  });
});
```

### 12. BookingForm.test.tsx

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/utils";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { BookingForm } from "../BookingForm";

expect.extend(toHaveNoViolations);

describe("BookingForm", () => {
  it("mostra tutti i campi obbligatori", () => {
    render(<BookingForm />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/artista/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo evento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data/i)).toBeInTheDocument();
  });

  it("non invia senza checkbox privacy", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    await user.type(screen.getByLabelText(/nome/i), "Mario Rossi");
    await user.type(screen.getByLabelText(/email/i), "mario@test.com");
    await user.click(screen.getByRole("button", { name: /invia/i }));

    expect(
      screen.getByText(/accettare.*privacy/i)
    ).toBeInTheDocument();
  });

  it("invia correttamente con dati validi", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    await user.type(screen.getByLabelText(/nome/i), "Mario Rossi");
    await user.type(screen.getByLabelText(/email/i), "mario@test.com");
    await user.type(screen.getByLabelText(/artista/i), "Red Moon");
    await user.selectOptions(screen.getByLabelText(/tipo evento/i), "matrimonio");
    await user.type(screen.getByLabelText(/data/i), "2025-09-15");
    await user.type(screen.getByLabelText(/luogo/i), "Como");
    await user.click(screen.getByLabelText(/privacy/i));
    await user.click(screen.getByRole("button", { name: /invia/i }));

    await waitFor(() => {
      expect(screen.getByText(/richiesta inviata/i)).toBeInTheDocument();
    });
  });

  it("mostra errore su risposta 400", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    // Invia senza email per triggare 400
    await user.type(screen.getByLabelText(/nome/i), "Mario Rossi");
    await user.click(screen.getByLabelText(/privacy/i));
    await user.click(screen.getByRole("button", { name: /invia/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("non ha violazioni a11y", async () => {
    const { container } = render(<BookingForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 13. BandFinder.test.tsx

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/utils";
import userEvent from "@testing-library/user-event";
import BandFinder from "../BandFinder";

// Mock del servizio Gemini
vi.mock("../../services/geminiService", () => ({
  scoutTalent: vi.fn().mockResolvedValue({
    artistId: 1,
    reasoning: "Band perfetta per feste estive.",
    vibeScore: 9,
  }),
}));

describe("BandFinder", () => {
  it("mostra il titolo TROVA LA TUA BAND", () => {
    render(<BandFinder onArtistSelect={() => {}} />);
    expect(screen.getByText(/trova la tua/i)).toBeInTheDocument();
  });

  it("mostra badge ASSISTENTE INTELLIGENTE", () => {
    render(<BandFinder onArtistSelect={() => {}} />);
    expect(screen.getByText(/assistente intelligente/i)).toBeInTheDocument();
  });

  it("mostra il campo di ricerca con placeholder italiano", () => {
    render(<BandFinder onArtistSelect={() => {}} />);
    expect(
      screen.getByPlaceholderText(/descrivi.*evento|cerco.*band/i)
    ).toBeInTheDocument();
  });

  it("mostra suggerimenti predefiniti in italiano", () => {
    render(<BandFinder onArtistSelect={() => {}} />);
    expect(screen.getByText(/matrimonio/i)).toBeInTheDocument();
  });

  it("cerca e mostra risultati", async () => {
    const user = userEvent.setup();
    render(<BandFinder onArtistSelect={() => {}} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "festa estiva con 200 persone");
    await user.click(screen.getByLabelText(/cerca/i));

    await waitFor(() => {
      expect(screen.getByText(/9\/10/)).toBeInTheDocument();
    });
  });
});
```

### 14. EventCard.test.tsx

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/utils";
import { EventCard } from "../EventCard";
import { mockEvents } from "../../test/fixtures/events";

describe("EventCard", () => {
  it("mostra data in formato italiano", () => {
    render(<EventCard event={mockEvents[0]} />);
    // 15 agosto 2025
    expect(screen.getByText(/15/)).toBeInTheDocument();
    expect(screen.getByText(/ago/i)).toBeInTheDocument();
  });

  it("mostra città e venue", () => {
    render(<EventCard event={mockEvents[0]} />);
    expect(screen.getByText(/bergamo/i)).toBeInTheDocument();
    expect(screen.getByText(/piazza vecchia/i)).toBeInTheDocument();
  });

  it("mostra badge Confermato per status confirmed", () => {
    render(<EventCard event={mockEvents[0]} />);
    expect(screen.getByText(/confermato/i)).toBeInTheDocument();
  });

  it("mostra badge archiviato per eventi passati", () => {
    render(<EventCard event={mockEvents[2]} />);
    expect(screen.getByText(/archiviato|passato/i)).toBeInTheDocument();
  });
});
```

### 15. HomePage.test.tsx

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "../../test/utils";
import { axe, toHaveNoViolations } from "jest-axe";
import { HomePage } from "../HomePage";

expect.extend(toHaveNoViolations);

describe("HomePage", () => {
  it("renderizza la sezione Hero", () => {
    render(<HomePage onNavigate={() => {}} />);
    expect(screen.getByText(/magix/i)).toBeInTheDocument();
  });

  it("mostra la griglia categorie", async () => {
    render(<HomePage onNavigate={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/dance show/i)).toBeInTheDocument();
      expect(screen.getByText(/tributo/i)).toBeInTheDocument();
    });
  });

  it("carica artisti in evidenza", async () => {
    render(<HomePage onNavigate={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Red Moon")).toBeInTheDocument();
    });
  });

  it("non ha violazioni a11y critiche", async () => {
    const { container } = render(<HomePage onNavigate={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 16. Script npm (aggiungi a package.json scripts)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## NOTE IMPLEMENTATIVE

- **MSW v2:** Usa la nuova sintassi con `http.get()` / `http.post()`, non `rest.get()`
- **userEvent vs fireEvent:** Preferire `userEvent.setup()` per simulazioni realistiche
- **jest-axe:** Eseguire su ogni componente interattivo per garantire WCAG 2.1 AA
- **Fixture coerenti:** I mock data usano le stesse interfacce TypeScript del frontend (`Artist`, `MusicEvent`)
- **Coverage thresholds:** 70% come minimo per merge, configurato in `vitest.config.ts`

---

## CRITERI DI ACCETTAZIONE

- [ ] `npm run test` esegue tutti i test senza errori
- [ ] MSW intercetta tutte le chiamate API senza warning
- [ ] Test ArtistCard: render, click, keyboard Enter, alt text, a11y
- [ ] Test ArtistGrid: load da API, skeleton, filtro genere
- [ ] Test BookingForm: campi obbligatori, privacy validation, submit 200, submit 400
- [ ] Test BandFinder: titolo "TROVA LA TUA BAND", badge "ASSISTENTE INTELLIGENTE", placeholder IT, suggerimenti IT, ricerca con risultati
- [ ] Test EventCard: data italiana, città/venue, badge stato
- [ ] Test HomePage: Hero, categorie, artisti in evidenza, a11y
- [ ] `npm run test:coverage` mostra coverage ≥ 70% su components/
- [ ] Nessun warning `act(...)` nei test
