# TASK 13 — Frontend Setup (Vite + React + Tailwind)

> **Agente:** Frontend  
> **Fase:** 4 — Frontend  
> **Dipendenze:** Task 10 (API pronto)  
> **Stima:** 30 min  

---

## OBIETTIVO

Adattare il progetto `template-strutturale/` in un frontend SPA production-ready con Vite, React 19, TypeScript e Tailwind CSS. Configurare il proxy verso l'API Wagtail e la struttura di progetto per la build di produzione.

---

## FILES_IN_SCOPE (da leggere)

- `template-strutturale/package.json`
- `template-strutturale/vite.config.ts`
- `template-strutturale/index.html`
- `template-strutturale/index.tsx`
- `template-strutturale/types.ts`
- `template-strutturale/tsconfig.json`

---

## OUTPUT_ATTESO

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
├── tailwind.config.ts
├── .env.example
├── .env.development
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # (shell vuoto, da Task 14+)
│   ├── types.ts                  # Esteso da template
│   ├── lib/
│   │   └── api.ts                # Client API centralizzato
│   ├── hooks/
│   │   ├── useArtists.ts
│   │   ├── useEvents.ts
│   │   └── useMenu.ts
│   ├── components/               # (vuoti, da Task 14-19)
│   ├── data/                     # (vuoto in dev, per mock fallback)
│   └── services/
│       └── geminiService.ts      # Copiato da template
```

---

## SPECIFICHE

### 1. package.json

```json
{
  "name": "magix-promotion-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^1.38.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "lucide-react": "^0.563.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.0",
    "@types/leaflet": "^1.9.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

### 2. vite.config.ts

```typescript
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    root: ".",
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        // Proxy API calls verso il backend Django/Wagtail
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
        },
        // Proxy per media files (immagini, EPK)
        "/media": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
```

### 3. tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 4. postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 5. types.ts — Esteso per Wagtail API

```typescript
/* === Frontend Types — allineati a Wagtail API v2 === */

export interface MusicEvent {
  id: number;
  title: string;
  date_start: string;       // ISO 8601
  date_end?: string;
  venue_name: string;
  city: string;
  region?: string;
  status: "AVAILABLE" | "SOLD OUT" | "LOW TICKETS" | "FREE";
  artist_id?: number;
  slug: string;
}

export interface Artist {
  id: number;
  title: string;             // Wagtail usa "title" per le pagine
  name: string;              // alias di title per retrocompatibilità template
  genre: string;             // stringa composita dei generi
  genres: string[];          // lista dei generi
  artist_type: string;
  image_url: string;
  hero_image_url?: string;
  bio: string;
  youtube_url?: string;
  socials: {
    instagram?: string;
    spotify?: string;
    facebook?: string;
  };
  tags: string[];
  events: MusicEvent[];
  slug: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon?: string;
  openInNewTab: boolean;
}

export interface MenuResponse {
  location: string;
  language: string;
  items: NavItem[];
}

/** Risposta paginata Wagtail API v2 */
export interface WagtailListResponse<T> {
  meta: {
    total_count: number;
  };
  items: T[];
}

export type ViewState = "HOME" | "TALENT" | "DETAIL" | "EVENTS" | "SCOUT" | "BOOKING";

/** Dati aziendali letti da SiteSettings API */
export interface SiteSettings {
  company_name: string;
  phone: string;
  email: string;
  address_street: string;
  address_city: string;
  address_zip: string;
  address_region: string;
  address_country: string;
  lat: number | null;
  lng: number | null;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  piva: string;
}
```

### 6. Client API — `src/lib/api.ts`

```typescript
/**
 * Client API per comunicare con Wagtail API v2.
 * Usa il proxy Vite in dev, URL assoluto in produzione.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function fetchJSON<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/* ---------- Artists ---------- */
export async function fetchArtists(params?: Record<string, string>) {
  return fetchJSON<import("@/types").WagtailListResponse<import("@/types").Artist>>(
    "/api/v2/pages/",
    { type: "artists.ArtistPage", fields: "*", ...params }
  );
}

export async function fetchArtist(slug: string) {
  const res = await fetchArtists({ slug });
  return res.items[0] ?? null;
}

/* ---------- Events ---------- */
export async function fetchEvents(params?: Record<string, string>) {
  return fetchJSON<import("@/types").WagtailListResponse<import("@/types").MusicEvent>>(
    "/api/v2/pages/",
    { type: "events.EventPage", fields: "*", ...params }
  );
}

/* ---------- Menu ---------- */
export async function fetchMenu(location: string, lang = "it") {
  return fetchJSON<import("@/types").MenuResponse>(
    `/api/v2/menu/${location}/`,
    { lang }
  );
}

/* ---------- SiteSettings ---------- */
export async function fetchSiteSettings() {
  return fetchJSON<import("@/types").SiteSettings>("/api/v2/site-settings/");
}
```

### 7. Hooks React

```typescript
// src/hooks/useArtists.ts
import { useState, useEffect } from "react";
import { Artist } from "@/types";
import { fetchArtists } from "@/lib/api";

export function useArtists(params?: Record<string, string>) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchArtists(params)
      .then((res) => setArtists(res.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(params)]);

  return { artists, loading, error };
}
```

```typescript
// src/hooks/useEvents.ts
import { useState, useEffect } from "react";
import { MusicEvent } from "@/types";
import { fetchEvents } from "@/lib/api";

export function useEvents(params?: Record<string, string>) {
  const [events, setEvents] = useState<MusicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchEvents(params)
      .then((res) => setEvents(res.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(params)]);

  return { events, loading, error };
}
```

```typescript
// src/hooks/useMenu.ts
import { useState, useEffect } from "react";
import { NavItem } from "@/types";
import { fetchMenu } from "@/lib/api";

export function useMenu(location: string, lang = "it") {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu(location, lang)
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [location, lang]);

  return { items, loading };
}
```

```typescript
// src/hooks/useSiteSettings.ts
import { useState, useEffect } from "react";
import { SiteSettings } from "@/types";
import { fetchSiteSettings } from "@/lib/api";

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
```

### 8. .env.example

```bash
# Backend Wagtail API
VITE_API_BASE_URL=http://localhost:8000

# Gemini AI (per BandFinder — Trova la tua Band)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Lingua default
VITE_DEFAULT_LANG=it
```

### 9. index.html (adattato da template)

Spostare gli stili CSS inline in un file `src/index.css` separato. Mantenere:
- Font Google (Inter + Space Grotesk)
- CSS custom properties per temi (electric-night / pastel-dream)
- Classi utility (.glass-panel, .gradient-text, .theme-transition)

Rimuovere:
- `<script type="importmap">` (gestito da Vite)
- CDN Tailwind (`cdn.tailwindcss.com`) → sostituire con PostCSS build

---

## NOTE IMPLEMENTATIVE

1. **Proxy Vite:** In dev, `/api/*` e `/media/*` vengono proxati al backend Django sulla porta 8000. In produzione il frontend è servito come file statici da Django/Nginx.
2. **Alias `@`:** Tutte le import usano `@/` per puntare a `src/`. Configurato sia in `vite.config.ts` che in `tsconfig.json`.
3. **Types allineati:** Il campo `id` è `number` (non `string` come nel mock). `title` è il campo standard Wagtail, `name` è un alias di retrocompatibilità.
4. **No React Router:** Come nel template, la navigazione è gestita tramite stato React (`ViewState`). Si può aggiungere React Router in futuro se necessario.
5. **Nessun CSS framework aggiuntivo:** Tailwind CSS + CSS custom properties per il tema. Niente Bootstrap, Material, etc.

---

## CRITERI DI ACCETTAZIONE

- [ ] `npm install` completa senza errori
- [ ] `npm run dev` avvia il dev server sulla porta 3000
- [ ] Proxy `/api/` e `/media/` verso localhost:8000 funzionante
- [ ] `tsc --noEmit` passa senza errori
- [ ] Client API (`lib/api.ts`) esporta funzioni per artist, events, menu
- [ ] Hook `useArtists`, `useEvents`, `useMenu` funzionanti
- [ ] CSS custom properties (temi) presenti in `src/index.css`
- [ ] Tailwind CSS compilato via PostCSS (no CDN)
- [ ] Alias `@/` risolve a `src/` in tutti i file
- [ ] Leaflet e react-leaflet installati per mappe OSM
- [ ] `useSiteSettings` hook funzionante con `/api/v2/site-settings/`
- [ ] Interfaccia `SiteSettings` in types.ts

---

## SEZIONE TDD

```typescript
// src/hooks/__tests__/useSiteSettings.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSiteSettings } from "../useSiteSettings";

describe("useSiteSettings", () => {
  it("carica i settings dal server", async () => {
    const { result } = renderHook(() => useSiteSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings).toBeTruthy();
  });
});
```

---

## SECURITY CHECKLIST

- [ ] `VITE_GEMINI_API_KEY` esposta solo nel frontend (non chiavi backend)
- [ ] Proxy API: solo `/api/` e `/media/`, non proxy wildcard
- [ ] Nessun dato sensibile in tipi SiteSettings (API key esclusa dal backend)
