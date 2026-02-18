import React from "react";
import { Sparkles, Wand2, ArrowRight } from "lucide-react";
import { scoutTalent, ScoutResult } from "@/services/geminiService";
import { Artist } from "@/types";
import { useArtists } from "@/hooks/useArtists";

interface BandFinderProps {
  onArtistSelect: (artist: Artist) => void;
}

const SUGGESTIONS = [
  "Band energica per un matrimonio",
  "Tributo ai Queen per un festival",
  "DJ set per evento aziendale",
  "Cover band italiana anni 80",
  "Band acustica per aperitivo",
  "Show band con ballerini per piazza",
];

const BandFinder: React.FC<BandFinderProps> = ({ onArtistSelect }) => {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ScoutResult | null>(null);

  // Carica tutti gli artisti per il pool AI
  const { data } = useArtists({ limit: 100 });
  const artists = data?.items || [];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || artists.length === 0) return;

    setLoading(true);
    setResult(null);

    // Prepara il pool per Gemini con i campi corretti
    const pool = artists.map((a) => ({
      id: a.id,
      name: a.title,
      genre: a.genre_display,
      bio: a.short_bio,
      artist_type: a.artist_type,
      tags: a.tags || [],
    }));

    const response = await scoutTalent(query, pool);
    setResult(response);
    setLoading(false);
  };

  const matchedArtist = result
    ? artists.find((a) => a.id === result.artistId)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 theme-transition">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[var(--accent)] text-sm font-bold tracking-widest mb-6">
          <Sparkles size={16} />
          ASSISTENTE INTELLIGENTE
        </div>
        <h2 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tighter mb-6 text-[var(--text-main)]">
          TROVA LA TUA <span className="gradient-text">BAND</span>
        </h2>
        <p className="text-[var(--text-muted)] text-xl font-light">
          Descrivi l'evento, il mood o il genere che cerchi. Il nostro
          assistente trovera' la band perfetta per te.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-12 relative group" role="search" aria-label="Cerca band con intelligenza artificiale">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='es: "Cerco una band energica per un matrimonio a Como..."'
          className="w-full bg-[var(--glass)] border border-[var(--glass-border)] px-8 py-6 rounded-3xl text-xl text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent)]/50 transition-all pr-20"
          aria-label="Descrivi la band che cerchi"
        />
        <button
          type="submit"
          disabled={loading || artists.length === 0}
          className="absolute right-4 top-4 bottom-4 w-12 rounded-2xl bg-[var(--accent)] text-[var(--bg-color)] flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20"
          aria-label="Cerca con AI"
        >
          {loading ? (
            <div className="animate-spin h-5 w-5 border-2 border-[var(--bg-color)] border-t-transparent rounded-full" />
          ) : (
            <Wand2 size={24} />
          )}
        </button>
      </form>

      {/* Loading skeleton */}
      <div aria-live="polite" aria-atomic="true">
      {loading && (
        <div className="animate-pulse flex flex-col gap-6" role="status" aria-label="Ricerca in corso">
          <div className="h-4 bg-[var(--glass)] rounded w-1/2" />
          <div className="h-64 bg-[var(--glass)] rounded-3xl w-full" />
          <span className="sr-only">Ricerca in corso...</span>
        </div>
      )}

      {/* Result */}
      {result && matchedArtist && (
        <div className="animate-in slide-in-from-bottom-8 duration-700">
          <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-[var(--glass-border)] shadow-2xl">
            <div className="flex flex-col md:flex-row">
              {/* Immagine */}
              <div className="md:w-1/3 aspect-square md:aspect-auto">
                <img
                  src={matchedArtist.image_url || ""}
                  alt={matchedArtist.title}
                  className="w-full h-full object-cover grayscale brightness-90"
                />
              </div>

              {/* Dettagli */}
              <div className="md:w-2/3 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-4xl font-heading font-extrabold tracking-tighter mb-2 text-[var(--text-main)]">
                      {matchedArtist.title}
                    </h3>
                    <p className="text-[var(--accent)] font-bold tracking-widest text-sm">
                      {matchedArtist.genre_display.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-col items-center glass-panel p-4 rounded-2xl border-[var(--accent)]/20">
                    <span className="text-xs text-[var(--text-muted)] font-bold">
                      MATCH
                    </span>
                    <span className="text-3xl font-heading font-black text-[var(--accent)]">
                      {result.vibeScore}/10
                    </span>
                  </div>
                </div>

                <div className="bg-[var(--glass)] p-6 rounded-2xl border border-[var(--glass-border)] mb-8 italic text-[var(--text-muted)] leading-relaxed">
                  &ldquo;{result.reasoning}&rdquo;
                </div>

                <button
                  onClick={() => onArtistSelect(matchedArtist)}
                  className="flex items-center gap-3 text-[var(--text-main)] font-bold group hover:text-[var(--accent)] transition-colors"
                >
                  VEDI PROFILO{" "}
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Errore: nessun match */}
      {result && !matchedArtist && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p className="text-xl">
            Nessun artista trovato. Prova a descrivere meglio il tuo evento.
          </p>
        </div>
      )}
      </div>{/* end aria-live region */}

      {/* Suggerimenti */}
      <div className="mt-16 flex flex-wrap justify-center gap-4">
        <span className="text-[var(--text-muted)] text-sm font-bold w-full text-center mb-2">
          PROVA CON:
        </span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setQuery(s)}
            className="px-4 py-2 rounded-full border border-[var(--glass-border)] text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all bg-[var(--glass)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BandFinder;
