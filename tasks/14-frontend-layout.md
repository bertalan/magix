# TASK 14 — Frontend Layout & Navigazione

> **Agente:** Frontend  
> **Fase:** 4 — Frontend  
> **Dipendenze:** Task 13, Task 12 (API menu)  
> **Stima:** 25 min  

---

## OBIETTIVO

Adattare il componente `Layout.tsx` dal template-strutturale per:
1. Consumare il menu dinamico via API (hook `useMenu`)
2. Brandizzare per Magix Promotion (nome, logo, colori)
3. Aggiungere voci menu aggiuntive (EVENTS, BOOKING)
4. Footer con colonne dinamiche

---

## FILES_IN_SCOPE (da leggere)

- `template-strutturale/components/Layout.tsx` — Componente originale
- `frontend/src/types.ts` — Tipi NavItem, ViewState
- `frontend/src/hooks/useMenu.ts` — Hook per API menu

---

## OUTPUT_ATTESO

```
frontend/src/components/
├── Layout.tsx           # Header + Footer + Mobile menu
├── Header.tsx           # Estratto da Layout per chiarezza
├── Footer.tsx           # Footer con colonne dinamiche
├── MobileMenu.tsx       # Overlay menu mobile
├── ThemeToggle.tsx      # Button cambio tema
```

---

## SPECIFICHE

### 1. Layout.tsx — Shell principale

```tsx
import React from "react";
import { ViewState } from "@/types";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  setView: (v: ViewState) => void;
  currentTheme: "electric-night" | "pastel-dream";
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeView,
  setView,
  currentTheme,
  toggleTheme,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-color)]">
      <Header
        activeView={activeView}
        setView={setView}
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
      />
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
```

### 2. Header.tsx — Navigazione principale

```tsx
import React from "react";
import { ViewState } from "@/types";
import { useMenu } from "@/hooks/useMenu";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";
import { Music, Users, Search, Calendar, Mail, Menu, X } from "lucide-react";

/** Mappa icone Lucide per nome stringa (da API menu) */
const ICON_MAP: Record<string, React.ElementType> = {
  music: Music,
  users: Users,
  search: Search,
  calendar: Calendar,
  mail: Mail,
};

/** Navigazione statiche di fallback se l'API menu non è disponibile */
const FALLBACK_NAV: Array<{ label: string; view: ViewState; icon: string }> = [
  { label: "HOME", view: "HOME", icon: "music" },
  { label: "ARTISTI", view: "TALENT", icon: "users" },
  { label: "EVENTI", view: "EVENTS", icon: "calendar" },
  { label: "TROVA LA TUA BAND", view: "SCOUT", icon: "search" },
  { label: "BOOKING", view: "BOOKING", icon: "mail" },
];

interface HeaderProps {
  activeView: ViewState;
  setView: (v: ViewState) => void;
  currentTheme: "electric-night" | "pastel-dream";
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({
  activeView,
  setView,
  currentTheme,
  toggleTheme,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { items: apiMenuItems } = useMenu("header");

  // Usa il menu API se disponibile, altrimenti fallback statico
  const navItems = apiMenuItems.length > 0
    ? apiMenuItems.map((item) => ({
        label: item.title,
        view: urlToView(item.url),
        icon: item.icon || "music",
      }))
    : FALLBACK_NAV;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel h-20 flex items-center px-6 md:px-12 justify-between theme-transition">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setView("HOME")}
        >
          <div className="w-10 h-10 bg-[var(--accent-gradient)] rounded-lg flex items-center justify-center font-bold text-xl font-heading transform -rotate-6 shadow-lg shadow-[var(--accent)]/20">
            <span className={currentTheme === "pastel-dream" ? "text-white" : "text-black"}>
              M
            </span>
          </div>
          <span className="font-heading font-extrabold text-2xl tracking-tighter text-[var(--text-main)]">
            MAGIX <span className="opacity-40">PROMOTION</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const IconComp = ICON_MAP[item.icon] || Music;
            return (
              <button
                key={item.label}
                onClick={() => setView(item.view)}
                className={`flex items-center gap-1.5 text-xs font-bold tracking-widest hover:text-[var(--accent)] transition-colors ${
                  activeView === item.view
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <IconComp size={14} />
                {item.label}
              </button>
            );
          })}
          <ThemeToggle currentTheme={currentTheme} toggleTheme={toggleTheme} />
        </nav>

        {/* Mobile toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle currentTheme={currentTheme} toggleTheme={toggleTheme} />
          <button
            className="text-[var(--text-main)]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Chiudi menu" : "Apri menu"}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {isMenuOpen && (
        <MobileMenu
          navItems={navItems}
          activeView={activeView}
          setView={(v) => {
            setView(v);
            setIsMenuOpen(false);
          }}
        />
      )}
    </>
  );
};

export default Header;

/* --- Utility --- */

/** Converte un URL del menu API in un ViewState */
function urlToView(url: string): ViewState {
  const map: Record<string, ViewState> = {
    "/": "HOME",
    "/artisti/": "TALENT",
    "/eventi/": "EVENTS",
    "/scout/": "SCOUT",
    "/booking/": "BOOKING",
  };
  return map[url] || "HOME";
}
```

### 3. Footer.tsx

```tsx
import React from "react";
import { useMenu } from "@/hooks/useMenu";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";

const Footer: React.FC = () => {
  const { items: legalLinks } = useMenu("footer_legal");
  const { settings } = useSiteSettings();

  /** Genera deep link navigazione per mobile/desktop */
  const getNavigationUrl = () => {
    if (!settings) return "#";
    if (settings.lat && settings.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${settings.lat},${settings.lng}`;
    }
    const addr = `${settings.address_street}, ${settings.address_zip} ${settings.address_city}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
  };

  return (
    <footer className="py-12 px-6 md:px-12 border-t border-[var(--glass-border)] bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Colonna brand */}
        <div className="flex flex-col gap-2">
          <span className="font-heading font-bold text-xl text-[var(--text-main)]">
            {settings?.company_name || "MAGIX PROMOTION"}
          </span>
          <span className="text-[var(--text-muted)] text-sm">
            © {new Date().getFullYear()} {settings?.company_name || "Magix Promotion"} — Tutti i diritti riservati.
          </span>
          {settings?.piva && (
            <span className="text-[var(--text-muted)] text-xs">P.IVA {settings.piva}</span>
          )}
        </div>

        {/* Colonna contatti (da SiteSettings) */}
        <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
          {settings?.phone && (
            <a href={`tel:${settings.phone}`} className="flex items-center gap-2 hover:text-[var(--text-main)] transition-colors">
              <Phone size={14} /> {settings.phone}
            </a>
          )}
          {settings?.email && (
            <a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-[var(--text-main)] transition-colors">
              <Mail size={14} /> {settings.email}
            </a>
          )}
          {settings?.address_street && (
            <a
              href={getNavigationUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[var(--text-main)] transition-colors"
              aria-label="Naviga verso la nostra sede"
            >
              <MapPin size={14} />
              {settings.address_street}, {settings.address_zip} {settings.address_city}
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Colonna link legali */}
        <div className="flex flex-col md:items-end gap-2 text-sm text-[var(--text-muted)]">
          {legalLinks.length > 0 ? (
            legalLinks.map((link) => (
              <a
                key={link.title}
                href={link.url}
                className="hover:text-[var(--text-main)] transition-colors"
                {...(link.openInNewTab ? { target: "_blank", rel: "noopener" } : {})}
              >
                {link.title.toUpperCase()}
              </a>
            ))
          ) : (
            <>
              <a href="#" className="hover:text-[var(--text-main)] transition-colors">PRIVACY</a>
              <a href="#" className="hover:text-[var(--text-main)] transition-colors">TERMINI</a>
              <a href="#" className="hover:text-[var(--text-main)] transition-colors">CONTATTI</a>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

### 4. MobileMenu.tsx

```tsx
import React from "react";
import { ViewState } from "@/types";

interface MobileMenuProps {
  navItems: Array<{ label: string; view: ViewState; icon: string }>;
  activeView: ViewState;
  setView: (v: ViewState) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ navItems, activeView, setView }) => {
  return (
    <div
      className="fixed inset-0 z-40 bg-[var(--bg-color)] flex flex-col items-center justify-center gap-8 text-3xl font-heading font-bold"
      role="dialog"
      aria-modal="true"
      aria-label="Menu navigazione"
    >
      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={() => setView(item.view)}
          className={`hover:text-[var(--accent)] transition-colors ${
            activeView === item.view ? "text-[var(--accent)]" : "text-[var(--text-main)]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default MobileMenu;
```

### 5. ThemeToggle.tsx

```tsx
import React from "react";
import { Sparkle, Moon } from "lucide-react";

interface ThemeToggleProps {
  currentTheme: "electric-night" | "pastel-dream";
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ currentTheme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text-main)] hover:scale-110 transition-transform"
      title={currentTheme === "electric-night" ? "Tema chiaro" : "Tema scuro"}
      aria-label="Cambia tema"
    >
      {currentTheme === "electric-night" ? <Sparkle size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
```

---

## DIFFERENZE DAL TEMPLATE

| Aspetto | Template | Adattamento |
|---------|----------|-------------|
| Brand | "Magix Promotion" | "MAGIX PROMOTION" |
| Logo lettera | "M" | "M" |
| Menu items | 3 (Music, Roster, Scout) | 5+ (Home, Artisti, Eventi, Trova la tua Band, Booking) |
| Menu source | Hardcoded array | API `/api/v2/menu/header/` con fallback |
| Footer links | Hardcoded | Da API `footer_legal` + dati da SiteSettings (tel, email, indirizzo) |
| Componenti | Monolitico Layout.tsx | Separati Header/Footer/MobileMenu/ThemeToggle |
| Viste | HOME, TALENT, DETAIL, SCOUT | + EVENTS, BOOKING |

---

## CRITERI DI ACCETTAZIONE

- [ ] Header mostra "MAGIX PROMOTION" con lettera "M"
- [ ] Menu desktop mostra 5 voci (Home, Artisti, Eventi, Trova la tua Band, Booking)
- [ ] Menu consuma API `/api/v2/menu/header/` con fallback statico
- [ ] Mobile menu overlay funzionante con animazione
- [ ] Theme toggle funzionante (electric-night ↔ pastel-dream)
- [ ] Footer mostra anno dinamico e link legali
- [ ] Footer mostra telefono, email e indirizzo da SiteSettings API
- [ ] Link indirizzo Footer apre navigazione (deep link Google Maps)
- [ ] Tutti i pulsanti hanno `aria-label` per accessibilità
- [ ] `urlToView()` mappa correttamente URL → ViewState

---

## SEZIONE TDD

```tsx
// src/components/__tests__/Footer.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "../../test/utils";

describe("Footer", () => {
  it("mostra il telefono da SiteSettings", async () => {
    render(<Footer />);
    await waitFor(() => {
      expect(screen.getByText(/335/)).toBeInTheDocument();
    });
  });

  it("link indirizzo punta a Google Maps", async () => {
    render(<Footer />);
    await waitFor(() => {
      const link = screen.getByLabelText(/naviga/i);
      expect(link).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
    });
  });
});
```

---

## SECURITY CHECKLIST

- [ ] Footer non espone API keys o dati sensibili
- [ ] Link esterni hanno `rel="noopener noreferrer"`
- [ ] Nessun dato utente nel footer (solo dati aziendali pubblici)
