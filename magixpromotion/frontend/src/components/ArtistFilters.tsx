import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ArtistFiltersProps {
  artistTypes: string[];
  activeType: string;
  onTypeChange: (type: string) => void;
}

/** Map artist_type API values to i18n keys under artists.* */
const TYPE_I18N_KEYS: Record<string, string> = {
  ALL: "artists.allTypes",
  show_band: "artists.typeShowBand",
  tribute: "artists.typeTribute",
  original: "artists.typeOriginal",
  dj: "artists.typeDj",
  cover: "artists.typeCover",
};

const ArtistFilters: React.FC<ArtistFiltersProps> = ({
  artistTypes,
  activeType,
  onTypeChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2">
      {artistTypes.map((type) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all ${
            activeType === type
              ? "bg-[var(--accent)] text-[var(--bg-color)] shadow-lg shadow-[var(--accent)]/20"
              : "bg-[var(--glass)] text-[var(--text-muted)] hover:bg-[var(--glass-border)]"
          }`}
        >
          {TYPE_I18N_KEYS[type] ? t(TYPE_I18N_KEYS[type]) : type.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default ArtistFilters;
