
import React from 'react';
import { Artist, MusicEvent } from '../types';
import { X, Instagram, Twitter, Music, Play, Volume2, MapPin, Ticket, Youtube } from 'lucide-react';

interface TalentDetailProps {
  artist: Artist;
  onClose: () => void;
}

const TalentDetail: React.FC<TalentDetailProps> = ({ artist, onClose }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const eventsRef = React.useRef<HTMLDivElement>(null);

  const handlePlayClick = () => {
    if (artist.youtubeUrl) {
      window.open(artist.youtubeUrl, '_blank');
    }
    setIsPlaying(true);
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };

  const scrollToEvents = () => {
    eventsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getStatusColor = (status: MusicEvent['status']) => {
    switch (status) {
      case 'SOLD OUT': return 'text-rose-500 border-rose-500/30 bg-rose-500/5';
      case 'LOW TICKETS': return 'text-amber-500 border-amber-500/30 bg-amber-500/5';
      case 'FREE': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5';
      default: return 'text-[var(--accent)] border-[var(--glass-border)] bg-[var(--accent)]/5';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[var(--bg-color)] animate-in fade-in duration-300">
      {/* Floating Notification */}
      {isPlaying && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-top-8 duration-500">
          <div className="glass-panel px-8 py-4 rounded-full border border-[var(--accent)]/30 flex items-center gap-4 shadow-xl">
            <Volume2 className="text-[var(--accent)] animate-pulse" />
            <span className="font-bold tracking-tight text-[var(--text-main)]">
              Opening <span className="text-[var(--accent)]">{artist.name}</span>'s video promo
            </span>
          </div>
        </div>
      )}

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="fixed top-8 right-8 z-[70] p-4 glass-panel rounded-full text-[var(--text-main)] hover:bg-[var(--glass)] transition-colors"
      >
        <X size={32} />
      </button>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side: Visuals */}
        <div className="lg:w-1/2 relative h-[50vh] lg:h-screen lg:sticky lg:top-0">
          <img 
            src={artist.imageUrl} 
            alt={artist.name}
            className="w-full h-full object-cover grayscale brightness-75 lg:brightness-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg-color)] lg:block hidden"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] to-transparent lg:hidden block"></div>
        </div>

        {/* Right Side: Content */}
        <div className="lg:w-1/2 px-6 py-20 lg:p-24 flex flex-col">
          <div className="animate-in slide-in-from-right-12 duration-700">
            <span className="text-[var(--accent)] font-bold tracking-[0.4em] text-sm mb-6 block uppercase">Artist Profile</span>
            <h1 className="text-6xl lg:text-9xl font-heading font-extrabold tracking-tighter mb-8 leading-none text-[var(--text-main)]">
              {artist.name}
            </h1>
            
            <div className="flex flex-wrap gap-4 mb-12">
              <span className="px-6 py-3 glass-panel rounded-full border border-[var(--glass-border)] text-[var(--text-muted)] font-bold text-sm">
                {artist.genre}
              </span>
              <div className="flex gap-4 items-center">
                {artist.socials.instagram && <a href={artist.socials.instagram} className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><Instagram size={24} /></a>}
                {artist.socials.twitter && <a href={artist.socials.twitter} className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><Twitter size={24} /></a>}
                {artist.socials.spotify && <a href={artist.socials.spotify} className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><Music size={24} /></a>}
              </div>
            </div>

            <div className="max-w-xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                <div className="w-8 h-[2px] bg-[var(--accent)]"></div>
                BIOGRAPHY
              </h3>
              <p className="text-lg lg:text-2xl text-[var(--text-muted)] font-light leading-relaxed mb-12">
                {artist.bio}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
              <div 
                onClick={handlePlayClick}
                className="p-8 glass-panel rounded-3xl border border-[var(--glass-border)] flex flex-col gap-4 group cursor-pointer hover:border-[var(--accent)]/30 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--bg-color)] group-hover:scale-110 transition-transform shadow-lg">
                  {artist.youtubeUrl ? <Youtube size={20} /> : <Play fill="currentColor" size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-xl uppercase text-[var(--text-main)]">Video Promo</h4>
                  <p className="text-[var(--text-muted)] text-sm">{artist.youtubeUrl ? 'Watch on YouTube' : 'Play video'}</p>
                </div>
              </div>
              <div 
                onClick={scrollToEvents}
                className="p-8 glass-panel rounded-3xl border border-[var(--glass-border)] flex flex-col gap-4 group cursor-pointer hover:border-[var(--accent-secondary)]/30 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--accent-secondary)] flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                  <Music size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xl uppercase text-[var(--text-main)]">Tour Dates</h4>
                  <p className="text-[var(--text-muted)] text-sm">{artist.events.length} Upcoming shows</p>
                </div>
              </div>
            </div>

            {/* Events Section */}
            <div ref={eventsRef} className="pt-12 mb-16 scroll-mt-24">
              <h3 className="text-3xl font-heading font-extrabold mb-10 flex items-center gap-4 text-[var(--text-main)]">
                <span className="text-[var(--accent)]">/</span> UPCOMING EVENTS
              </h3>
              
              <div className="flex flex-col gap-4">
                {artist.events.map((event) => (
                  <div 
                    key={event.id}
                    className="glass-panel group p-6 rounded-2xl border border-[var(--glass-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--glass)] hover:border-[var(--accent)]/30 transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-center">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase leading-none mb-1">
                          {event.date.split(' ')[0]}
                        </span>
                        <span className="text-2xl font-black text-[var(--text-main)] leading-none">
                          {event.date.split(' ')[1]}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-bold text-[var(--text-main)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                          {event.venue}
                        </h4>
                        <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
                          <MapPin size={14} className="text-[var(--accent)]/60" />
                          {event.city}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className={`text-[10px] font-black tracking-[0.2em] px-3 py-1.5 rounded border ${getStatusColor(event.status)}`}>
                        {event.status === 'FREE' ? 'FREE ENTRANCE' : event.status}
                      </div>
                      <button className="p-3 rounded-full bg-[var(--text-main)] text-[var(--bg-color)] hover:scale-110 transition-transform transform group-hover:bg-[var(--accent)]">
                        <Ticket size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full px-12 py-6 bg-[var(--text-main)] text-[var(--bg-color)] font-black tracking-widest hover:scale-[1.02] transition-all rounded-full text-lg shadow-xl shadow-[var(--accent)]/10">
              BOOKING ENQUIRIES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentDetail;
