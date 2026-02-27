/**
 * Pulsante cambio lingua IT/EN.
 *
 * Stile coerente con ThemeToggle.
 * WCAG: aria-label descrittivo, focus-visible, contrasto.
 */
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang, t } = useLanguage();

  const toggleLang = () => {
    setLang(lang === "it" ? "en" : "it");
  };

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1.5 p-2 rounded-full bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text-main)] hover:scale-110 transition-transform text-xs font-bold tracking-wider"
      aria-label={t("lang.switchLabel")}
      title={t("lang.switchLabel")}
    >
      <Globe size={16} />
      <span>{lang === "it" ? "EN" : "IT"}</span>
    </button>
  );
};

export default LanguageSwitcher;
