# TASK 21 — Accessibilità WCAG 2.1 AA

> **Agente:** Frontend  
> **Fase:** 5 — Qualità & Ottimizzazione  
> **Dipendenze:** Task 14-19 (frontend completato)  
> **Stima:** 25 min  

---

## OBIETTIVO

Verificare e garantire la conformità WCAG 2.1 livello AA su tutti i componenti frontend. Include:
1. Contrasto colori sufficiente per entrambi i temi
2. Navigazione keyboard-only completa  
3. Screen reader support (ARIA landmarks, live regions)
4. Focus management nei modali
5. Riduzione animazioni per `prefers-reduced-motion`

---

## FILES_IN_SCOPE (da leggere)

- `idea/5-frontend-ux-inclusive.md` — Sezione accessibilità
- `frontend/src/components/*.tsx` — Tutti i componenti frontend

---

## OUTPUT_ATTESO

```
frontend/src/
├── index.css                 # Aggiunte media query reduced-motion, focus styles
├── hooks/
│   └── useReducedMotion.ts   # Hook per prefers-reduced-motion
├── components/
│   └── SkipLink.tsx          # Skip to content link
```

Modifiche a tutti i componenti esistenti (Task 14-19) per aggiungere attributi ARIA.

---

## SPECIFICHE

### 1. Skip Link

```tsx
// frontend/src/components/SkipLink.tsx
import React from "react";

const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-[var(--accent)] focus:text-[var(--bg-color)] focus:rounded-full focus:font-bold focus:tracking-wider"
    >
      Vai al contenuto principale
    </a>
  );
};

export default SkipLink;
```

Aggiungere in Layout.tsx:
```tsx
<SkipLink />
<main id="main-content" className="flex-grow pt-20" role="main">
```

### 2. Hook useReducedMotion

```tsx
// frontend/src/hooks/useReducedMotion.ts
import { useState, useEffect } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
```

### 3. CSS — Focus & Reduced Motion

```css
/* Aggiungere a src/index.css */

/* ===== Focus visibile ===== */
:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Rimuovi outline per click mouse */
:focus:not(:focus-visible) {
  outline: none;
}

/* ===== Screen reader only ===== */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* ===== Reduced motion ===== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .animate-pulse,
  .animate-bounce,
  .animate-spin {
    animation: none !important;
  }
}
```

### 4. Checklist ARIA per ogni componente

#### Header.tsx
```tsx
<header role="banner">
  <nav role="navigation" aria-label="Navigazione principale">
    {/* Voci menu */}
  </nav>
</header>
```

#### MobileMenu.tsx
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-label="Menu navigazione"
>
  {/* Focus trap: il focus non deve uscire dal modale */}
</div>
```

#### ArtistDetail.tsx
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-label={`Profilo artista: ${artist.name}`}
>
  {/* Focus trap + chiusura con Escape */}
</div>
```

#### ArtistCard.tsx
```tsx
<article
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === "Enter" && onClick()}
  aria-label={`Vedi dettagli di ${artist.name}`}
>
```

#### Immagini
```tsx
<img alt={`Foto di ${artist.name}`} />
/* MAI alt="" per immagini decorative che trasmettono informazione */
/* alt="" SOLO per background decorativi puri */
```

#### Form (BookingForm.tsx)
```tsx
<input aria-required="true" aria-invalid={!!error} aria-describedby="nome-error" />
<span id="nome-error" role="alert">{error}</span>
```

### 5. Focus Trap per Modali

```typescript
// frontend/src/hooks/useFocusTrap.ts
import { useEffect, useRef } from "react";

export function useFocusTrap<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus il primo elemento
    first?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      // Escape chiude (gestito dal componente padre)
    };

    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, []);

  return ref;
}
```

### 6. Contrasto Colori — Verifica

| Tema | Coppia | Ratio minimo | Target |
|------|--------|-------------|--------|
| Electric Night | `#ffffff` su `#080112` | 19.7:1 | ✅ AAA |
| Electric Night | `rgba(255,255,255,0.5)` su `#080112` | ~9.5:1 | ✅ AA |
| Electric Night | `#ff00f7` su `#080112` | 5.2:1 | ✅ AA |
| Pastel Dream | `#4a1d33` su `#fffafb` | 11.3:1 | ✅ AAA |
| Pastel Dream | `#8b5d73` su `#fffafb` | 4.6:1 | ✅ AA |
| Pastel Dream | `#ffadd2` su `#fffafb` | ⚠️ 1.8:1 | ❌ FAIL |

**Fix necessario per Pastel Dream:** L'accent `#ffadd2` su sfondo `#fffafb` NON supera AA. Usare `#d4789b` per testo accent su sfondo chiaro:

```css
[data-theme='pastel-dream'] {
  --accent-text: #d4789b;  /* Ratio 3.5:1 — AA per large text */
  /* Usare --accent-text per testi, --accent per backgrounds */
}
```

---

## CRITERI DI ACCETTAZIONE

- [ ] Skip link visibile al Tab, nascosto altrimenti
- [ ] Tutti i modali hanno focus trap (ArtistDetail, MobileMenu)
- [ ] Escape chiude modali e overlay
- [ ] Tutti i pulsanti hanno aria-label descrittivo
- [ ] Form booking ha aria-required e aria-invalid appropriati
- [ ] `role="banner"`, `role="navigation"`, `role="main"` presenti
- [ ] Immagini artisti hanno alt text descrittivo
- [ ] `prefers-reduced-motion` disabilita tutte le animazioni
- [ ] Focus visibile con outline 3px accent su tutti i temi
- [ ] Contrasto colori ≥ 4.5:1 per testo normale su entrambi i temi
- [ ] Lighthouse Accessibility score ≥ 95
- [ ] Navigazione completa solo con tastiera (Tab, Enter, Escape)
