import React from "react";
import { ViewState } from "@/types";

interface HeroProps {
  setView: (v: ViewState) => void;
}

const Hero: React.FC<HeroProps> = ({ setView }) => {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden theme-transition">
      {/* Background blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--accent)] opacity-20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--accent-secondary)] opacity-20 blur-[120px] rounded-full animate-pulse delay-700" />

      {/* Gradient mask */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-[var(--bg-color)]/60 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-6">
        <h2 className="text-[var(--text-muted)] text-sm md:text-base font-bold tracking-[0.5em] mb-4 animate-in slide-in-from-bottom-4 duration-1000">
          AGENZIA BAND & ARTISTI — ITALIA E OLTRE
        </h2>
        <h1 className="text-5xl md:text-8xl lg:text-9xl font-heading font-extrabold tracking-tighter mb-8 max-w-5xl mx-auto leading-none animate-in slide-in-from-bottom-8 duration-1000 text-[var(--text-main)]">
          LA TUA <span className="gradient-text">BAND</span> PERFETTA
        </h1>
        <p className="text-lg md:text-2xl text-[var(--text-muted)] max-w-2xl mx-auto mb-12 font-light leading-relaxed animate-in slide-in-from-bottom-12 duration-1000">
          Dance show band, tributi, DJ set e formazioni live per ogni evento.
          Dai matrimoni ai festival, il sound giusto per la tua serata, in
          Italia e nel mondo.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-16 duration-1000 fill-mode-both">
          <button
            onClick={() => setView("TALENT")}
            className="px-10 py-4 bg-[var(--text-main)] text-[var(--bg-color)] font-bold tracking-wider hover:scale-105 transition-all duration-300 rounded-full shadow-lg shadow-[var(--accent)]/10"
          >
            SCOPRI IL ROSTER
          </button>
          <button
            onClick={() => setView("BOOKING")}
            className="px-10 py-4 glass-panel text-[var(--text-main)] font-bold tracking-wider hover:bg-[var(--glass)] hover:scale-105 transition-all duration-300 rounded-full"
          >
            RICHIEDI PREVENTIVO
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[var(--accent)] to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
