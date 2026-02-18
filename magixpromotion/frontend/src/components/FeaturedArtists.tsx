import React from "react";
import { useArtists } from "@/hooks/useArtists";
import { Artist, ViewState } from "@/types";
import ArtistCard from "./ArtistCard";

interface FeaturedArtistsProps {
  onArtistClick: (artist: Artist) => void;
  setView: (v: ViewState) => void;
}

const FeaturedArtists: React.FC<FeaturedArtistsProps> = ({
  onArtistClick,
  setView,
}) => {
  // Carica i primi 3 artisti come preview
  const { data, loading } = useArtists({ limit: 3 });
  const artists = data?.items || [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-3xl bg-[var(--glass)] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <h2 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight text-[var(--text-main)] mb-4 uppercase">
        In Evidenza
      </h2>
      <p className="text-[var(--text-muted)] text-lg mb-12 max-w-xl">
        Le band e gli artisti più richiesti della nostra agenzia.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {artists.map((artist) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            onClick={() => onArtistClick(artist)}
          />
        ))}
      </div>

      <div className="text-center pt-16 pb-8">
        <button
          onClick={() => setView("TALENT")}
          className="px-12 py-5 border border-[var(--glass-border)] rounded-full hover:bg-[var(--glass)] transition-colors font-bold tracking-widest text-[var(--text-main)]"
        >
          VEDI TUTTO IL ROSTER
        </button>
      </div>
    </section>
  );
};

export default FeaturedArtists;
