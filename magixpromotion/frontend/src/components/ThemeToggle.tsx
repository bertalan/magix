import React from "react";
import { Sparkle, Moon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ThemeToggleProps {
  currentTheme: "electric-night" | "pastel-dream";
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ currentTheme, toggleTheme }) => {
  const { t } = useLanguage();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text-main)] hover:scale-110 transition-transform"
      title={currentTheme === "electric-night" ? t("theme.toLight") : t("theme.toDark")}
      aria-label={currentTheme === "electric-night" ? t("theme.toLight") : t("theme.toDark")}
    >
      {currentTheme === "electric-night" ? <Sparkle size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
