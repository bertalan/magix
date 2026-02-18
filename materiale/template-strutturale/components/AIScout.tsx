
import React from 'react';
import { Sparkles, Wand2, ArrowRight } from 'lucide-react';
import { scoutTalent } from '../services/geminiService';
import { Artist } from '../types';

interface AIScoutProps {
  artists: Artist[];
  onArtistSelect: (artist: Artist) => void;
}

const AIScout: React.FC<AIScoutProps> = ({ artists, onArtistSelect }) => {
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResult(null);
    const response = await scoutTalent(query, artists);
    setResult(response);
    setLoading(false);
  };

  const matchedArtist = result ? artists.find(a => a.id === result.artistId) : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 theme-transition">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[var(--accent)] text-sm font-bold tracking-widest mb-6">
          <Sparkles size={16} />
          POWERED BY GEMINI 3
        </div>
        <h2 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tighter mb-6 text-[var(--text-main)]">
          AI <span className="gradient-text">SCOUT</span>
        </h2>
        <p className="text-[var(--text-muted)] text-xl font-light">
          Describe the vibe, genre, or mood you're looking for, and our neural scout will find the perfect match.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-12 relative group">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 'I need someone with an ethereal voice...'"
          className="w-full bg-[var(--glass)] border border-[var(--glass-border)] px-8 py-6 rounded-3xl text-xl text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent)]/50 transition-all pr-20"
        />
        <button 
          type="submit"
          disabled={loading}
          className="absolute right-4 top-4 bottom-4 w-12 rounded-2xl bg-[var(--accent)] text-[var(--bg-color)] flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20"
        >
          {loading ? <div className="animate-spin h-5 w-5 border-2 border-[var(--bg-color)] border-t-transparent rounded-full" /> : <Wand2 size={24} />}
        </button>
      </form>

      {loading && (
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-4 bg-[var(--glass)] rounded w-1/2"></div>
          <div className="h-64 bg-[var(--glass)] rounded-3xl w-full"></div>
        </div>
      )}

      {result && matchedArtist && (
        <div className="animate-in slide-in-from-bottom-8 duration-700">
          <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-[var(--glass-border)] shadow-2xl">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 aspect-square md:aspect-auto">
                <img src={matchedArtist.imageUrl} alt={matchedArtist.name} className="w-full h-full object-cover grayscale brightness-90" />
              </div>
              <div className="md:w-2/3 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-4xl font-heading font-extrabold tracking-tighter mb-2 text-[var(--text-main)]">{matchedArtist.name}</h3>
                    <p className="text-[var(--accent)] font-bold tracking-widest text-sm">{matchedArtist.genre.toUpperCase()}</p>
                  </div>
                  <div className="flex flex-col items-center glass-panel p-4 rounded-2xl border-[var(--accent)]/20">
                    <span className="text-xs text-[var(--text-muted)] font-bold">VIBE SCORE</span>
                    <span className="text-3xl font-heading font-black text-[var(--accent)]">{result.vibeScore}/10</span>
                  </div>
                </div>
                
                <div className="bg-[var(--glass)] p-6 rounded-2xl border border-[var(--glass-border)] mb-8 italic text-[var(--text-muted)] leading-relaxed">
                  "{result.reasoning}"
                </div>

                <button 
                  onClick={() => onArtistSelect(matchedArtist)}
                  className="flex items-center gap-3 text-[var(--text-main)] font-bold group hover:text-[var(--accent)] transition-colors"
                >
                  VIEW PROFILE <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-16 flex flex-wrap justify-center gap-4">
        <span className="text-[var(--text-muted)] text-sm font-bold w-full text-center mb-2">TRY THESE:</span>
        {['High energy synth-punk', 'Dreamy female pop vocals', 'Electronic glitch textures'].map(s => (
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

export default AIScout;
