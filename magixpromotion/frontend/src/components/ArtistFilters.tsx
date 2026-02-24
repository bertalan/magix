import React from "react";

interface ArtistFiltersProps {
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
  artistTypes,
  activeType,
  onTypeChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {artistTypes.map((t) => (
        <button
          key={t}
          onClick={() => onTypeChange(t)}
          className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all ${
            activeType === t
              ? "bg-[var(--accent)] text-[var(--bg-color)] shadow-lg shadow-[var(--accent)]/20"
              : "bg-[var(--glass)] text-[var(--text-muted)] hover:bg-[var(--glass-border)]"
          }`}
        >
          {TYPE_LABELS[t] || t.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default ArtistFilters;
