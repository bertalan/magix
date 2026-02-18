import React from "react";
import { Artist, ViewState } from "@/types";
import Hero from "./Hero";
import FeaturedArtists from "./FeaturedArtists";

interface HomePageProps {
  setView: (v: ViewState) => void;
  onArtistClick: (artist: Artist) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setView, onArtistClick }) => {
  return (
    <>
      <Hero setView={setView} />
      <FeaturedArtists onArtistClick={onArtistClick} setView={setView} />

      {/* Sezione categorie rapide */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Dance Show Band", emoji: "\uD83C\uDFA4" },
            { label: "Tributo Italiano", emoji: "\uD83C\uDDEE\uD83C\uDDF9" },
            { label: "Tributo Internazionale", emoji: "\uD83C\uDF0D" },
            { label: "Dee-Jay", emoji: "\uD83C\uDFA7" },
          ].map((cat) => (
            <button
              key={cat.label}
              onClick={() => setView("TALENT")}
              className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] text-center hover:border-[var(--accent)]/30 transition-all group"
            >
              <span className="text-3xl block mb-2">{cat.emoji}</span>
              <span className="text-sm font-bold tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
                {cat.label.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
