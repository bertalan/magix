/**
 * LanguageContext — Fornisce lingua corrente, setter e funzione t() a tutta l'app.
 *
 * Persistenza su localStorage (key: "magix-lang").
 * Sincronizza i18next quando la lingua cambia.
 */
import React, { createContext, useContext, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

export type Lang = "it" | "en";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("magix-lang");
    return saved === "en" ? "en" : "it";
  });

  const setLang = useCallback(
    (newLang: Lang) => {
      setLangState(newLang);
      localStorage.setItem("magix-lang", newLang);
      i18n.changeLanguage(newLang);
    },
    [i18n],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook per accedere al LanguageContext.
 * Deve essere usato all'interno di un LanguageProvider.
 */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage deve essere usato dentro <LanguageProvider>");
  }
  return ctx;
}
