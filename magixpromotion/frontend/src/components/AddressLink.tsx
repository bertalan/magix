import React from "react";
import { ExternalLink } from "lucide-react";

interface AddressLinkProps {
  venueName: string;
  city: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
}

/**
 * Genera un link di navigazione universale verso Google Maps.
 * - Con lat/lng: deep link preciso con coordinate
 * - Senza lat/lng: ricerca per indirizzo testuale
 * - Mostra country se diverso da IT
 */
const AddressLink: React.FC<AddressLinkProps> = ({
  venueName,
  city,
  country,
  lat,
  lng,
}) => {
  const navigationUrl =
    lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venueName}, ${city}`)}`;

  const displayLocation =
    country && country !== "IT"
      ? `${venueName} — ${city} (${country})`
      : `${venueName} — ${city}`;

  return (
    <a
      href={navigationUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
      aria-label={`Naviga verso ${venueName}, ${city}`}
    >
      {displayLocation}
      <ExternalLink size={12} className="opacity-50" />
    </a>
  );
};

export default AddressLink;
