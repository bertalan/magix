import React from "react";

interface EventFiltersProps {
  cities: string[];
  activeCity: string;
  onCityChange: (city: string) => void;
}

/**
 * Filtro per citta': mostra chip selezionabili per ogni citta' unica negli eventi.
 * Il valore speciale "ALL" mostra tutte le citta'.
 * Se c'e' solo "ALL" (nessuna citta' effettiva), il componente non viene renderizzato.
 */
const EventFilters: React.FC<EventFiltersProps> = ({
  cities,
  activeCity,
  onCityChange,
}) => {
  if (cities.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {cities.map((city) => (
        <button
          key={city}
          onClick={() => onCityChange(city)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all border ${
            activeCity === city
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
          }`}
        >
          {city === "ALL" ? "TUTTE LE CITTA'" : city.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default EventFilters;
