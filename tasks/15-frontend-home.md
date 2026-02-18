# TASK 15 — Frontend Hero & HomePage

> **Agente:** Frontend  
> **Fase:** 4 — Frontend  
> **Dipendenze:** Task 13, Task 14  
> **Stima:** 20 min  

---

## OBIETTIVO

Adattare il componente `Hero.tsx` per Magix Promotion e comporre la vista HOME con Hero + anteprima artisti + call-to-action. Il contenuto deve essere localizzato IT/EN e brandizzato.

---

## FILES_IN_SCOPE (da leggere)

- `template-strutturale/components/Hero.tsx` — Componente originale
- `template-strutturale/App.tsx` — Come Hero è usato nella vista HOME
- `frontend/src/hooks/useArtists.ts`
- `frontend/src/components/ArtistCard.tsx` (da Task 16)

---

## OUTPUT_ATTESO

```
frontend/src/components/
├── Hero.tsx              # Hero section adattata
├── HomePage.tsx          # Composizione: Hero + preview roster + CTA
├── FeaturedArtists.tsx   # Carousel/grid artisti in evidenza
```

---

## SPECIFICHE

### 1. Hero.tsx — Adattato per Magix Promotion

```tsx
import React from "react";
import { ViewState } from "@/types";

interface HeroProps {
  setView: (v: ViewState) => void;
}

const Hero: React.FC<HeroProps> = ({ setView }) => {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden theme-transition">
      {/* Background blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--accent)] opacity-20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--accent-secondary)] opacity-20 blur-[120px] rounded-full animate-pulse delay-700" />

      {/* Gradient mask */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-[var(--bg-color)]/60 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-6">
        <h2 className="text-[var(--text-muted)] text-sm md:text-base font-bold tracking-[0.5em] mb-4 animate-in slide-in-from-bottom-4 duration-1000">
          AGENZIA BAND & ARTISTI — ITALIA E OLTRE
        </h2>
        <h1 className="text-5xl md:text-8xl lg:text-9xl font-heading font-extrabold tracking-tighter mb-8 max-w-5xl mx-auto leading-none animate-in slide-in-from-bottom-8 duration-1000 text-[var(--text-main)]">
          LA TUA <span className="gradient-text">BAND</span> PERFETTA
        </h1>
        <p className="text-lg md:text-2xl text-[var(--text-muted)] max-w-2xl mx-auto mb-12 font-light leading-relaxed animate-in slide-in-from-bottom-12 duration-1000">
          Dance show band, tributi, DJ set e formazioni live per ogni evento.
          Dai matrimoni ai festival, il sound giusto per la tua serata, in Italia e nel mondo.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-16 duration-1000 fill-mode-both">
          <button
            onClick={() => setView("TALENT")}
            className="px-10 py-4 bg-[var(--text-main)] text-[var(--bg-color)] font-bold tracking-wider hover:scale-105 transition-all duration-300 rounded-full shadow-lg shadow-[var(--accent)]/10"
          >
            SCOPRI IL ROSTER
          </button>
          <button
            onClick={() => setView("BOOKING")}
            className="px-10 py-4 glass-panel text-[var(--text-main)] font-bold tracking-wider hover:bg-[var(--glass)] hover:scale-105 transition-all duration-300 rounded-full"
          >
            RICHIEDI PREVENTIVO
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[var(--accent)] to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
```

### 2. FeaturedArtists.tsx — Preview artisti in evidenza

```tsx
import React from "react";
import { useArtists } from "@/hooks/useArtists";
import { Artist, ViewState } from "@/types";
import ArtistCard from "./ArtistCard";

interface FeaturedArtistsProps {
  onArtistClick: (artist: Artist) => void;
  setView: (v: ViewState) => void;
}

const FeaturedArtists: React.FC<FeaturedArtistsProps> = ({ onArtistClick, setView }) => {
  // Carica i primi 3 artisti come preview
  const { artists, loading } = useArtists({ limit: "3" });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-3xl bg-[var(--glass)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <h2 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight text-[var(--text-main)] mb-4 uppercase">
        In Evidenza
      </h2>
      <p className="text-[var(--text-muted)] text-lg mb-12 max-w-xl">
        Le band e gli artisti più richiesti della nostra agenzia.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} onClick={() => onArtistClick(artist)} />
        ))}
      </div>

      <div className="text-center pt-16 pb-8">
        <button
          onClick={() => setView("TALENT")}
          className="px-12 py-5 border border-[var(--glass-border)] rounded-full hover:bg-[var(--glass)] transition-colors font-bold tracking-widest text-[var(--text-main)]"
        >
          VEDI TUTTO IL ROSTER
        </button>
      </div>
    </section>
  );
};

export default FeaturedArtists;
```

### 3. HomePage.tsx — Composizione vista HOME

```tsx
import React from "react";
import { Artist, ViewState } from "@/types";
import Hero from "./Hero";
import FeaturedArtists from "./FeaturedArtists";

interface HomePageProps {
  setView: (v: ViewState) => void;
  onArtistClick: (artist: Artist) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setView, onArtistClick }) => {
  return (
    <>
      <Hero setView={setView} />
      <FeaturedArtists onArtistClick={onArtistClick} setView={setView} />
      
      {/* Sezione categorie rapide */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Dance Show Band", emoji: "🎤" },
            { label: "Tributo Italiano", emoji: "🇮🇹" },
            { label: "Tributo Internazionale", emoji: "🌍" },
            { label: "Dee-Jay", emoji: "🎧" },
          ].map((cat) => (
            <button
              key={cat.label}
              onClick={() => setView("TALENT")}
              className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] text-center hover:border-[var(--accent)]/30 transition-all group"
            >
              <span className="text-3xl block mb-2">{cat.emoji}</span>
              <span className="text-sm font-bold tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
                {cat.label.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
```

---

## DIFFERENZE DAL TEMPLATE

| Aspetto | Template | Adattamento |
|---------|----------|-------------|
| Titolo Hero | "THE FUTURE OF SOUND" | "LA TUA BAND PERFETTA" |
| Sottotitolo | "GLOBAL TALENT HUB" | "AGENZIA BAND & ARTISTI — ITALIA E OLTRE" |
| Descrizione | Inglese generico | IT specifico (matrimoni, festival..) |
| CTA primario | "EXPLORE ROSTER" | "SCOPRI IL ROSTER" |
| CTA secondario | "OUR STORY" | "RICHIEDI PREVENTIVO" → vista BOOKING |
| Preview artisti | `ARTISTS.slice(0, 3)` hardcoded | `useArtists({ limit: "3" })` da API |
| Categorie | Nessuna | Grid 4 categorie rapide (da CSV) |
| Loading state | Nessuno | Skeleton placeholder animato |

---

## CRITERI DI ACCETTAZIONE

- [ ] Hero mostra testi in italiano con brand Magix Promotion
- [ ] CTA "SCOPRI IL ROSTER" naviga a vista TALENT
- [ ] CTA "RICHIEDI PREVENTIVO" naviga a vista BOOKING
- [ ] FeaturedArtists carica 3 artisti da API
- [ ] Skeleton loader visibile durante caricamento
- [ ] Grid categorie rapide con 4 tipologie (dal CSV reale)
- [ ] Tutte le animazioni (slide-in, pulse) mantenute dal template
- [ ] Layout responsive: mobile → tablet → desktop

---

## SEZIONE TDD

```tsx
// src/components/__tests__/Hero.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/utils";
import Hero from "../Hero";

describe("Hero", () => {
  it("mostra il sottotitolo con scope internazionale", () => {
    render(<Hero setView={() => {}} />);
    expect(screen.getByText(/italia e oltre/i)).toBeInTheDocument();
  });

  it("ha i due CTA button", () => {
    render(<Hero setView={() => {}} />);
    expect(screen.getByText(/scopri il roster/i)).toBeInTheDocument();
    expect(screen.getByText(/richiedi preventivo/i)).toBeInTheDocument();
  });
});
```

---

## SECURITY CHECKLIST

- [ ] Nessun dato sensibile nella Hero o HomePage
- [ ] Link CTA non contengono URL esterni
