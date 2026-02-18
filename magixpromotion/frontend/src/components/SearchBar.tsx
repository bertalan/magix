import React, { useState, useRef, useEffect } from "react";
import { useSearch } from "../hooks/useSearch";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onResultClick?: (result: {
    type: string;
    slug: string;
    id: number;
  }) => void;
}

/**
 * Search bar con autocomplete dropdown.
 *
 * Mostra suggerimenti artisti in tempo reale (autocomplete)
 * e permette ricerca completa su Enter.
 */
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Cerca artisti, eventi...",
  className = "",
  onResultClick,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, suggestions, loading, search, autocomplete, clearResults } =
    useSearch();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length >= 2) {
      autocomplete(value);
      setIsOpen(true);
    } else {
      clearResults();
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.length >= 2) {
      search(query);
      setIsOpen(true);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: {
    id: number;
    name: string;
    slug: string;
  }) => {
    setQuery(suggestion.name);
    setIsOpen(false);
    onResultClick?.({ type: "artist", slug: suggestion.slug, id: suggestion.id });
  };

  const handleResultClick = (result: {
    type: string;
    slug: string;
    id: number;
  }) => {
    setIsOpen(false);
    onResultClick?.(result);
  };

  const showDropdown =
    isOpen && (suggestions.length > 0 || results.length > 0 || loading);

  return (
    <div ref={wrapperRef} className={`search-bar ${className}`} role="search">
      <label htmlFor="search-input" className="sr-only">
        Cerca
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query.length >= 2) setIsOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        aria-label="Cerca artisti e eventi"
        aria-expanded={showDropdown}
        aria-controls="search-results"
        role="combobox"
      />

      {showDropdown && (
        <div
          id="search-results"
          className="search-dropdown"
          role="listbox"
          aria-label="Risultati ricerca"
        >
          {loading && (
            <div className="search-loading" role="status">
              Ricerca in corso...
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">Suggerimenti</div>
              {suggestions.map((s) => (
                <button
                  key={`suggestion-${s.id}`}
                  className="search-item"
                  onClick={() => handleSuggestionClick(s)}
                  role="option"
                  type="button"
                >
                  <span className="search-item-name">{s.name}</span>
                  {s.genre && (
                    <span className="search-item-meta">{s.genre}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">Risultati</div>
              {results.map((r) => (
                <button
                  key={`result-${r.type}-${r.id}`}
                  className="search-item"
                  onClick={() =>
                    handleResultClick({
                      type: r.type,
                      slug: r.slug,
                      id: r.id,
                    })
                  }
                  role="option"
                  type="button"
                >
                  <span className="search-item-type">
                    {r.type === "artist" ? "Artista" : "Evento"}
                  </span>
                  <span className="search-item-name">{r.title}</span>
                  {r.genre && (
                    <span className="search-item-meta">{r.genre}</span>
                  )}
                  {r.venue_name && (
                    <span className="search-item-meta">
                      {r.venue_name} - {r.city}
                    </span>
                  )}
                  {r.start_date && (
                    <span className="search-item-date">{r.start_date}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
