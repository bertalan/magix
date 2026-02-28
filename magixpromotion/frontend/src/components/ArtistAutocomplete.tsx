import React from "react";
import { fetchArtists } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Artist } from "@/types";
import { Search, Lock, ChevronDown } from "lucide-react";

interface ArtistAutocompleteProps {
  /** Valore corrente del campo */
  value: string;
  /** Callback quando il valore cambia */
  onChange: (value: string) => void;
  /** Se true, il campo è bloccato (preselezionato da navigazione) */
  locked?: boolean;
  /** Classi CSS aggiuntive per l'input */
  className?: string;
}

/**
 * Campo autocomplete per selezionare un artista del roster.
 * - Carica la lista artisti dall'API al mount
 * - Mostra suggerimenti filtrati durante la digitazione
 * - Permette scrittura libera (artista non nel roster)
 * - Include opzione "Altro / Non in elenco" sempre visibile
 * - Se locked=true, il campo è readonly (provenienza da scheda artista)
 */
const ArtistAutocomplete: React.FC<ArtistAutocompleteProps> = ({
  value,
  onChange,
  locked = false,
  className = "",
}) => {
  const { lang } = useLanguage();
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightIndex, setHighlightIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Carica la lista artisti al mount
  React.useEffect(() => {
    let cancelled = false;
    fetchArtists({ limit: 50, locale: lang })
      .then((res) => {
        if (!cancelled) {
          setArtists(res.items);
        }
      })
      .catch(() => {
        // Fallback silenzioso: il campo resta utilizzabile come testo libero
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Suggerimenti filtrati in base al testo digitato
  const suggestions = React.useMemo(() => {
    if (!value.trim()) {
      // Se vuoto, mostra tutte le band ordinate per nome
      return artists
        .map((a) => a.title)
        .sort((a, b) => a.localeCompare(b));
    }
    const q = value.toLowerCase();
    return artists
      .map((a) => a.title)
      .filter((name) => name.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b));
  }, [artists, value]);

  // Chiudi dropdown quando si clicca fuori
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (!isOpen) setIsOpen(true);
    setHighlightIndex(-1);
  };

  const handleFocus = () => {
    if (!locked) {
      setIsOpen(true);
    }
  };

  // Navigazione da tastiera nel dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    // Totale voci: suggerimenti + "Altro..." (se non è già il valore)
    const totalItems = suggestions.length + 1; // +1 per "Altro..."

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : totalItems - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
          handleSelect(suggestions[highlightIndex]);
        } else if (highlightIndex === suggestions.length) {
          // "Altro..." selezionato: svuota il campo per scrittura libera
          handleSelect("");
          inputRef.current?.focus();
        } else {
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  // Se il campo è bloccato (preselezionato), mostra come readonly
  if (locked) {
    return (
      <div className={`relative ${className}`}>
        <input
          type="text"
          value={value}
          readOnly
          aria-label="Artista o band richiesta"
          className={`${className} pr-10 cursor-not-allowed opacity-75`}
        />
        <Lock
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Artista / Band richiesta *"
          required
          aria-required="true"
          aria-label="Artista o band richiesta"
          aria-autocomplete="list"
          aria-controls={isOpen ? "artist-suggestions" : undefined}
          aria-activedescendant={
            highlightIndex >= 0 ? `artist-option-${highlightIndex}` : undefined
          }
          autoComplete="off"
          className={className}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {value && (
            <Search
              size={14}
              className="text-[var(--text-muted)]/40"
              aria-hidden="true"
            />
          )}
          <ChevronDown
            size={14}
            className={`text-[var(--text-muted)]/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Dropdown suggerimenti */}
      {isOpen && (
        <ul
          id="artist-suggestions"
          role="listbox"
          aria-label="Suggerimenti artisti"
          className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl bg-[var(--bg-color)] border border-[var(--glass-border)] shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          {suggestions.map((name, idx) => (
            <li
              key={name}
              id={`artist-option-${idx}`}
              role="option"
              aria-selected={highlightIndex === idx}
              onMouseDown={(e) => {
                e.preventDefault(); // Previene la perdita del focus
                handleSelect(name);
              }}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`px-5 py-3 cursor-pointer text-sm transition-colors ${
                highlightIndex === idx
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-[var(--text-main)] hover:bg-[var(--glass)]"
              } ${idx === 0 ? "rounded-t-2xl" : ""}`}
            >
              {name}
            </li>
          ))}

          {/* Separatore + Opzione "Altro" */}
          {suggestions.length > 0 && (
            <li className="border-t border-[var(--glass-border)]" aria-hidden="true" />
          )}
          <li
            id={`artist-option-${suggestions.length}`}
            role="option"
            aria-selected={highlightIndex === suggestions.length}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect("");
              // Focus sull'input per scrittura libera
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            onMouseEnter={() => setHighlightIndex(suggestions.length)}
            className={`px-5 py-3 cursor-pointer text-sm italic rounded-b-2xl transition-colors ${
              highlightIndex === suggestions.length
                ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:bg-[var(--glass)]"
            }`}
          >
            Altro / Non in elenco...
          </li>

          {/* Messaggio se nessun risultato */}
          {suggestions.length === 0 && value.trim() && (
            <li className="px-5 py-3 text-sm text-[var(--text-muted)] italic border-b border-[var(--glass-border)]">
              Nessun artista trovato per &quot;{value}&quot;
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default ArtistAutocomplete;
