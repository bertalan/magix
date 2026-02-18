
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden theme-transition">
      {/* Abstract Background Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--accent)] opacity-20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--accent-secondary)] opacity-20 blur-[120px] rounded-full animate-pulse delay-700"></div>
      
      {/* Background Mask */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-[var(--bg-color)]/60 to-transparent"></div>
      </div>

      <div className="relative z-10 text-center px-6">
        <h2 className="text-[var(--text-muted)] text-sm md:text-base font-bold tracking-[0.5em] mb-4 animate-in slide-in-from-bottom-4 duration-1000">
          GLOBAL TALENT HUB
        </h2>
        <h1 className="text-6xl md:text-9xl font-heading font-extrabold tracking-tighter mb-8 max-w-5xl mx-auto leading-none animate-in slide-in-from-bottom-8 duration-1000 text-[var(--text-main)]">
          THE <span className="gradient-text">FUTURE</span> OF SOUND
        </h1>
        <p className="text-lg md:text-2xl text-[var(--text-muted)] max-w-2xl mx-auto mb-12 font-light leading-relaxed animate-in slide-in-from-bottom-12 duration-1000">
          Representing the most influential voices in music today. From underground movements to global charts.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-16 duration-1000 fill-mode-both">
          <button className="px-10 py-4 bg-[var(--text-main)] text-[var(--bg-color)] font-bold tracking-wider hover:scale-105 transition-all duration-300 rounded-full shadow-lg shadow-[var(--accent)]/10">
            EXPLORE ROSTER
          </button>
          <button className="px-10 py-4 glass-panel text-[var(--text-main)] font-bold tracking-wider hover:bg-[var(--glass)] hover:scale-105 transition-all duration-300 rounded-full">
            OUR STORY
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[var(--accent)] to-transparent"></div>
      </div>
    </section>
  );
};

export default Hero;
