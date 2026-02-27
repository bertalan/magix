import React from "react";
import { Artist, ViewState } from "@/types";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();

  return (
    <>
      <SEOHead
        title={t("home.title")}
        description={t("home.description")}
        type="website"
      />
      <HomepageJsonLd settings={settings} />

      <Hero setView={setView} />

      {/* Chi Siamo — presentazione agenzia */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl md:text-4xl font-heading font-extrabold tracking-tight text-[var(--text-main)] mb-6 uppercase">
          {t("home.whoWeAre")} <span className="gradient-text">{t("home.whoWeAreAccent")}</span>
        </h2>
        <p className="text-base md:text-lg text-[var(--text-muted)] leading-relaxed font-light">
          {t("home.whoWeAreBody")}
        </p>
      </section>

      <FeaturedArtists onArtistClick={onArtistClick} setView={setView} />

      {/* Sezione categorie rapide */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("home.danceShowBand"), emoji: "\uD83C\uDFA4" },
            { label: t("home.tributoItaliano"), emoji: "\uD83C\uDDEE\uD83C\uDDF9" },
            { label: t("home.tributoInternazionale"), emoji: "\uD83C\uDF0D" },
            { label: t("home.deeJay"), emoji: "\uD83C\uDFA7" },
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
