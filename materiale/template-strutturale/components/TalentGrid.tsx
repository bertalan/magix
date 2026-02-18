
import React from 'react';
import { Artist } from '../types';
import ArtistCard from './ArtistCard';

interface TalentGridProps {
  artists: Artist[];
  onArtistClick: (artist: Artist) => void;
}

const TalentGrid: React.FC<TalentGridProps> = ({ artists, onArtistClick }) => {
  const [filter, setFilter] = React.useState('ALL');
  const [search, setSearch] = React.useState('');

  const genres = ['ALL', ...Array.from(new Set(artists.map(a => a.genre.split('/')[0].trim())))];

  const filteredArtists = artists.filter(artist => {
    const matchesFilter = filter === 'ALL' || artist.genre.includes(filter);
    const matchesSearch = artist.name.toLowerCase().includes(search.toLowerCase()) || 
                          artist.genre.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
        <div>
          <h2 className="text-4xl md:text-6xl font-heading font-extrabold mb-4 tracking-tight text-[var(--text-main)] uppercase">Band di Magix</h2>
          <div className="flex flex-wrap gap-3">
            {genres.map((g: string) => (
              <button
                key={g}
                onClick={() => setFilter(g)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all ${
                  filter === g 
                    ? 'bg-[var(--accent)] text-[var(--bg-color)] shadow-lg shadow-[var(--accent)]/20' 
                    : 'bg-[var(--glass)] text-[var(--text-muted)] hover:bg-[var(--glass-border)]'
                }`}
              >
                {g.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full md:w-80">
          <input 
            type="text"
            placeholder="Search artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--glass)] border border-[var(--glass-border)] px-6 py-3 rounded-full text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent)]/50 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {filteredArtists.length > 0 ? (
          filteredArtists.map((artist) => (
            <ArtistCard 
              key={artist.id} 
              artist={artist} 
              onClick={() => onArtistClick(artist)} 
            />
          ))
        ) : (
          <div className="col-span-full py-24 text-center text-[var(--text-muted)]">
            <p className="text-xl">No artists found in the digital ether.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TalentGrid;
