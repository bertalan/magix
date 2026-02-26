import React from "react";
import { Artist, ViewState } from "@/types";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Hero from "./Hero";
import FeaturedArtists from "./FeaturedArtists";
import SEOHead from "./SEOHead";
import { HomepageJsonLd } from "./JsonLdScript";

interface HomePageProps {
  setView: (v: ViewState) => void;
  onArtistClick: (artist: Artist) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setView, onArtistClick }) => {
  const { data: settings } = useSiteSettings();

  return (
    <>
      <SEOHead
        title="Magix Promotion — Booking & Management Musicale"
        description="Agenzia di band e artisti musicali per eventi, concerti e feste private in Italia e nel mondo."
        type="website"
      />
      <HomepageJsonLd settings={settings} />

      <Hero setView={setView} />

      {/* Chi Siamo — presentazione agenzia */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl md:text-4xl font-heading font-extrabold tracking-tight text-[var(--text-main)] mb-6 uppercase">
          Chi <span className="gradient-text">Siamo</span>
        </h2>
        <p className="text-base md:text-lg text-[var(--text-muted)] leading-relaxed font-light">
          Magix Promotion International Agency è un'agenzia che opera nel campo
          della musica dal vivo per l'organizzazione di eventi, festival e altre
          iniziative. Collaborazioni con i più importanti live club italiani ed
          esteri ci permette di essere in grado di garantire la produzione di
          eventi musicali curandone ogni aspetto: artistico, tecnico, logistico e
          promozionale con grande professionalità grazie anche alla nostra
          passione per la musica.
        </p>
      </section>

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
