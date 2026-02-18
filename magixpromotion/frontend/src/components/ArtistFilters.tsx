import React from "react";

interface ArtistFiltersProps {
  genres: string[];
  activeGenre: string;
  onGenreChange: (genre: string) => void;
  artistTypes: string[];
  activeType: string;
  onTypeChange: (type: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  ALL: "TUTTI",
  show_band: "SHOW BAND",
  tribute: "TRIBUTO",
  original: "ORIGINALE",
  dj: "DJ",
  cover: "COVER",
};

const ArtistFilters: React.FC<ArtistFiltersProps> = ({
  genres,
  activeGenre,
  onGenreChange,
  artistTypes,
  activeType,
  onTypeChange,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Filtro genere */}
      <div className="flex flex-wrap gap-2">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => onGenreChange(g)}
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all ${
              activeGenre === g
                ? "bg-[var(--accent)] text-[var(--bg-color)] shadow-lg shadow-[var(--accent)]/20"
                : "bg-[var(--glass)] text-[var(--text-muted)] hover:bg-[var(--glass-border)]"
            }`}
          >
            {g === "ALL" ? "TUTTI" : g.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Filtro tipo artista */}
      <div className="flex flex-wrap gap-2">
        {artistTypes.map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all border ${
              activeType === t
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
            }`}
          >
            {TYPE_LABELS[t] || t.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArtistFilters;
