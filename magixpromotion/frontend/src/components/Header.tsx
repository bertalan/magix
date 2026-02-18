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

/** Navigazione statica di fallback se l'API menu non e' disponibile */
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
  const { data: menuData } = useMenu("header");

  // Usa il menu API se disponibile, altrimenti fallback statico
  const apiMenuItems = menuData?.items || [];
  const navItems =
    apiMenuItems.length > 0
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
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setView("HOME")}
          aria-label="Magix Promotion — Torna alla home"
        >
          <div className="w-10 h-10 bg-[var(--accent-gradient)] rounded-lg flex items-center justify-center font-bold text-xl font-heading transform -rotate-6 shadow-lg shadow-[var(--accent)]/20">
            <span
              className={
                currentTheme === "pastel-dream" ? "text-white" : "text-black"
              }
            >
              M
            </span>
          </div>
          <span className="font-heading font-extrabold text-2xl tracking-tighter text-[var(--text-main)]">
            MAGIX <span className="opacity-40">PROMOTION</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navigazione principale">
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
                aria-current={activeView === item.view ? "page" : undefined}
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
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
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
          onClose={() => setIsMenuOpen(false)}
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
