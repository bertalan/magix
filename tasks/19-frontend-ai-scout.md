# TASK 19 — Trova la tua Band — BandFinder (Gemini)

> **Agente:** Frontend  
> **Fase:** 4 — Frontend  
> **Dipendenze:** Task 13, Task 16  
> **Stima:** 20 min  

---

## OBIETTIVO

Adattare il componente `AIScout.tsx` dal template, rinominandolo in **BandFinder**:
1. Rinominare componente, interfaccia e file: `AIScout` → `BandFinder`
2. Usare il pool artisti da API (non più mock)
3. Localizzare testi in italiano
4. Adattare prompt Gemini al contesto band agency internazionale
5. Titolo "AI SCOUT" → "TROVA LA TUA BAND"
6. Badge: rimuovere "POWERED BY GEMINI AI" → "ASSISTENTE INTELLIGENTE"

---

## FILES_IN_SCOPE (da leggere)

- `template-strutturale/components/AIScout.tsx` — Componente originale
- `template-strutturale/services/geminiService.ts` — Service Gemini 3
- `frontend/src/types.ts` — Artist interface
- `frontend/src/hooks/useArtists.ts`

---

## OUTPUT_ATTESO

```
frontend/src/components/
├── BandFinder.tsx         # Componente rinominato (ex AIScout)
frontend/src/services/
├── geminiService.ts       # Service adattato per contesto IT
```

---

## SPECIFICHE

### 1. geminiService.ts — Prompt adattato

```typescript
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
});

export interface ScoutResult {
  artistId: number;
  reasoning: string;
  vibeScore: number;
}

export const scoutTalent = async (
  query: string,
  artistPool: Array<{ id: number; name: string; genre: string; bio: string; artist_type: string; tags: string[] }>
): Promise<ScoutResult | null> => {
  const model = "gemini-2.0-flash";

  const systemInstruction = `Sei l'assistente BandFinder di Magix Promotion, agenzia di band e artisti musicali.
Il tuo compito è trovare l'artista o band più adatta alla richiesta dell'utente nel nostro roster.

Contesto: L'agenzia ha sede in Italia (Novi Ligure, AL) ma gestisce eventi anche all'estero.
Le tipologie includono: Dance Show Band, Tributo Italiano, Tributo Internazionale, DJ Set, Rock Band, Folk Band.

Roster disponibile:
${JSON.stringify(artistPool.map(a => ({ id: a.id, name: a.name, genre: a.genre, bio: a.bio, type: a.artist_type, tags: a.tags })))}

REGOLE:
- Rispondi SEMPRE in italiano
- Sii professionale ma amichevole
- Il reasoning deve essere una frase breve e incisiva che spiega il match
- Il vibeScore va da 1 a 10 dove 10 è match perfetto
- Scegli SOLO artisti dal roster fornito`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            artistId: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            vibeScore: { type: Type.NUMBER },
          },
          required: ["artistId", "reasoning", "vibeScore"],
        },
      },
    });

    return JSON.parse(response.text || "{}") as ScoutResult;
  } catch (error) {
    console.error("Errore Gemini Scout:", error);
    return null;
  }
};
```

### 2. BandFinder.tsx — Componente rinominato

```tsx
import React from "react";
import { Sparkles, Wand2, ArrowRight } from "lucide-react";
import { scoutTalent, ScoutResult } from "@/services/geminiService";
import { Artist, ViewState } from "@/types";
import { useArtists } from "@/hooks/useArtists";

interface BandFinderProps {
  onArtistSelect: (artist: Artist) => void;
}

const SUGGESTIONS = [
  "Band energica per un matrimonio",
  "Tributo ai Queen per un festival",
  "DJ set per evento aziendale",
  "Cover band italiana anni 80",
  "Band acustica per aperitivo",
  "Show band con ballerini per piazza",
];

const BandFinder: React.FC<BandFinderProps> = ({ onArtistSelect }) => {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ScoutResult | null>(null);

  // Carica tutti gli artisti per il pool AI
  const { artists } = useArtists({ limit: "100" });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || artists.length === 0) return;

    setLoading(true);
    setResult(null);
    const response = await scoutTalent(query, artists);
    setResult(response);
    setLoading(false);
  };

  const matchedArtist = result
    ? artists.find((a) => a.id === result.artistId)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 theme-transition">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[var(--accent)] text-sm font-bold tracking-widest mb-6">
          <Sparkles size={16} />
          ASSISTENTE INTELLIGENTE
        </div>
        <h2 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tighter mb-6 text-[var(--text-main)]">
          TROVA LA TUA <span className="gradient-text">BAND</span>
        </h2>
        <p className="text-[var(--text-muted)] text-xl font-light">
          Descrivi l'evento, il mood o il genere che cerchi.
          Il nostro assistente troverà la band perfetta per te.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-12 relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='es: "Cerco una band energica per un matrimonio a Como..."'
          className="w-full bg-[var(--glass)] border border-[var(--glass-border)] px-8 py-6 rounded-3xl text-xl text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent)]/50 transition-all pr-20"
          aria-label="Descrivi la band che cerchi"
        />
        <button
          type="submit"
          disabled={loading || artists.length === 0}
          className="absolute right-4 top-4 bottom-4 w-12 rounded-2xl bg-[var(--accent)] text-[var(--bg-color)] flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20"
          aria-label="Cerca con AI"
        >
          {loading ? (
            <div className="animate-spin h-5 w-5 border-2 border-[var(--bg-color)] border-t-transparent rounded-full" />
          ) : (
            <Wand2 size={24} />
          )}
        </button>
      </form>

      {/* Loading skeleton */}
      {loading && (
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-4 bg-[var(--glass)] rounded w-1/2" />
          <div className="h-64 bg-[var(--glass)] rounded-3xl w-full" />
        </div>
      )}

      {/* Result */}
      {result && matchedArtist && (
        <div className="animate-in slide-in-from-bottom-8 duration-700">
          <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-[var(--glass-border)] shadow-2xl">
            <div className="flex flex-col md:flex-row">
              {/* Immagine */}
              <div className="md:w-1/3 aspect-square md:aspect-auto">
                <img
                  src={matchedArtist.image_url}
                  alt={matchedArtist.name}
                  className="w-full h-full object-cover grayscale brightness-90"
                />
              </div>

              {/* Dettagli */}
              <div className="md:w-2/3 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-4xl font-heading font-extrabold tracking-tighter mb-2 text-[var(--text-main)]">
                      {matchedArtist.name}
                    </h3>
                    <p className="text-[var(--accent)] font-bold tracking-widest text-sm">
                      {matchedArtist.genre.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-col items-center glass-panel p-4 rounded-2xl border-[var(--accent)]/20">
                    <span className="text-xs text-[var(--text-muted)] font-bold">MATCH</span>
                    <span className="text-3xl font-heading font-black text-[var(--accent)]">
                      {result.vibeScore}/10
                    </span>
                  </div>
                </div>

                <div className="bg-[var(--glass)] p-6 rounded-2xl border border-[var(--glass-border)] mb-8 italic text-[var(--text-muted)] leading-relaxed">
                  "{result.reasoning}"
                </div>

                <button
                  onClick={() => onArtistSelect(matchedArtist)}
                  className="flex items-center gap-3 text-[var(--text-main)] font-bold group hover:text-[var(--accent)] transition-colors"
                >
                  VEDI PROFILO{" "}
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Errore: nessun match */}
      {result && !matchedArtist && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p className="text-xl">Nessun artista trovato. Prova a descrivere meglio il tuo evento.</p>
        </div>
      )}

      {/* Suggerimenti */}
      <div className="mt-16 flex flex-wrap justify-center gap-4">
        <span className="text-[var(--text-muted)] text-sm font-bold w-full text-center mb-2">
          PROVA CON:
        </span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setQuery(s)}
            className="px-4 py-2 rounded-full border border-[var(--glass-border)] text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all bg-[var(--glass)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BandFinder;
```

---

## DIFFERENZE DAL TEMPLATE

| Aspetto | Template | Adattamento |
|---------|----------|-------------|
| Nome componente | `AIScout` | `BandFinder` |
| Nome interfaccia | `AIScoutProps` | `BandFinderProps` |
| Nome file | `Scout.tsx` | `BandFinder.tsx` |
| Titolo H2 | "AI SCOUT" | "TROVA LA TUA BAND" |
| Badge | "POWERED BY GEMINI AI" | "ASSISTENTE INTELLIGENTE" |
| Pool artisti | `artists` prop (mock) | `useArtists()` da API |
| artistId tipo | `string` | `number` (da Wagtail) |
| Model Gemini | `gemini-3-flash-preview` | `gemini-2.0-flash` (stabile) |
| System prompt | Inglese generico | Italiano, contesto internazionale / band agency |
| Suggerimenti | Inglese ("High energy synth-punk...") | Italiano ("Band energica per un matrimonio...") |
| Campo immagine | `imageUrl` | `image_url` |
| Label score | "VIBE SCORE" | "MATCH" |
| Lingua UI | Inglese | Italiano |
| API key | `process.env.API_KEY` | `import.meta.env.VITE_GEMINI_API_KEY` |
| Errore no match | Non gestito | Messaggio "Nessun artista trovato" |

---

## CRITERI DI ACCETTAZIONE

- [ ] BandFinder carica artisti da API (non mock)
- [ ] Componente rinominato: `AIScout` → `BandFinder`
- [ ] Titolo: "AI SCOUT" → "TROVA LA TUA BAND"
- [ ] Badge: "POWERED BY GEMINI AI" → "ASSISTENTE INTELLIGENTE"
- [ ] System prompt Gemini in italiano con contesto internazionale
- [ ] Suggerimenti pertinenti al roster reale (matrimoni, tributi, DJ...)
- [ ] Risultato mostra immagine, nome, genere, score, reasoning
- [ ] Reasoning è in italiano
- [ ] "VEDI PROFILO" apre ArtistDetail
- [ ] Loading state con skeleton
- [ ] Gestione errore se Gemini non risponde
- [ ] Gestione caso "artista non trovato nel roster"
- [ ] API key Gemini da variabile ambiente Vite

---

## SEZIONE TDD

```tsx
// src/components/__tests__/BandFinder.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "../../test/utils";
import userEvent from "@testing-library/user-event";
import BandFinder from "../BandFinder";

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
    expect(screen.getByText(/band/i)).toBeInTheDocument();
  });

  it("mostra badge ASSISTENTE INTELLIGENTE (non GEMINI AI)", () => {
    render(<BandFinder onArtistSelect={() => {}} />);
    expect(screen.getByText(/assistente intelligente/i)).toBeInTheDocument();
    expect(screen.queryByText(/gemini ai/i)).not.toBeInTheDocument();
  });

  it("mostra suggerimenti in italiano", () => {
    render(<BandFinder onArtistSelect={() => {}} />);
    expect(screen.getByText(/matrimonio/i)).toBeInTheDocument();
  });

  it("cerca e mostra risultati", async () => {
    const user = userEvent.setup();
    render(<BandFinder onArtistSelect={() => {}} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "festa estiva");
    await user.click(screen.getByLabelText(/cerca/i));
    await waitFor(() => {
      expect(screen.getByText(/9\/10/)).toBeInTheDocument();
    });
  });
});
```

---

## SECURITY CHECKLIST

- [ ] API key Gemini solo in env var frontend (VITE_GEMINI_API_KEY)
- [ ] System prompt non espone dati interni dell'agenzia
- [ ] Input utente sanitizzato prima di inviare a Gemini
- [ ] Rate limiting lato client: max 1 richiesta ogni 3 secondi
