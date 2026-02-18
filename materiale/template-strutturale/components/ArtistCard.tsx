
import React from 'react';
import { Artist } from '../types';
import { Plus } from 'lucide-react';

interface ArtistCardProps {
  artist: Artist;
  onClick: () => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  return (
    <div 
      className="group relative cursor-pointer overflow-hidden rounded-3xl aspect-[3/4] glass-panel transition-all duration-500 hover:-translate-y-2 shadow-[var(--card-shadow)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
      onClick={onClick}
    >
      {/* Background Image */}
      <img 
        src={artist.imageUrl} 
        alt={artist.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100"
      />
      
      {/* Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-transparent to-transparent group-hover:via-[var(--bg-color)]/20 transition-all duration-500"></div>
      
      {/* Plus Icon Button */}
      <div className="absolute top-6 right-6 w-12 h-12 rounded-full glass-panel border border-[var(--glass-border)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
        <Plus className="text-[var(--text-main)]" />
      </div>

      {/* Text Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-transform duration-500 group-hover:translate-y-[-8px]">
        <div className="flex flex-wrap gap-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
          {artist.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] font-black bg-[var(--accent)] text-[var(--bg-color)] px-2 py-0.5 rounded tracking-tighter shadow-sm">
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
        <h3 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tighter text-[var(--text-main)] mb-2 leading-none">
          {artist.name}
        </h3>
        <p className="text-[var(--text-muted)] text-sm font-medium tracking-wide">
          {artist.genre.toUpperCase()}
        </p>
      </div>

      {/* Hover Highlight line */}
      <div className="absolute bottom-0 left-0 w-0 h-1.5 bg-[var(--accent-gradient)] transition-all duration-500 group-hover:w-full"></div>
    </div>
  );
};

export default ArtistCard;
