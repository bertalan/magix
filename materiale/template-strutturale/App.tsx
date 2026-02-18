
import React from 'react';
import Layout from './components/Layout';
import Hero from './components/Hero';
import TalentGrid from './components/TalentGrid';
import TalentDetail from './components/TalentDetail';
import AIScout from './components/AIScout';
import { ARTISTS } from './data/mockTalent';
import { Artist, ViewState } from './types';

const App: React.FC = () => {
  const [view, setView] = React.useState<ViewState>('HOME');
  const [theme, setTheme] = React.useState<'electric-night' | 'pastel-dream'>('electric-night');
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'electric-night' ? 'pastel-dream' : 'electric-night');
  };

  const renderContent = () => {
    switch (view) {
      case 'HOME':
        return (
          <>
            <Hero />
            <div>
              <TalentGrid artists={ARTISTS.slice(0, 3)} onArtistClick={handleArtistClick} />
              <div className="text-center pb-24">
                <button 
                  onClick={() => setView('TALENT')}
                  className="px-12 py-5 border border-[var(--glass-border)] rounded-full hover:bg-[var(--glass)] transition-colors font-bold tracking-widest text-[var(--text-main)]"
                >
                  VIEW FULL ROSTER
                </button>
              </div>
            </div>
          </>
        );
      case 'TALENT':
        return <TalentGrid artists={ARTISTS} onArtistClick={handleArtistClick} />;
      case 'SCOUT':
        return <AIScout artists={ARTISTS} onArtistSelect={handleArtistClick} />;
      default:
        return <Hero />;
    }
  };

  return (
    <Layout activeView={view} setView={setView} currentTheme={theme} toggleTheme={toggleTheme}>
      <div className="theme-transition">
        {renderContent()}
      </div>
      
      {selectedArtist && (
        <TalentDetail 
          artist={selectedArtist} 
          onClose={() => setSelectedArtist(null)} 
        />
      )}
    </Layout>
  );
};

export default App;
