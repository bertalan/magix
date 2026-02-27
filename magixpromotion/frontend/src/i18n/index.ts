/**
 * Configurazione i18next per MagixPromotion.
 *
 * - Lingua default: "it"
 * - Lingue supportate: IT, EN
 * - Detection: localStorage key "magix-lang"
 * - Nessun backend HTTP — JSON importati staticamente
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import it from "./it.json";
import en from "./en.json";

const savedLang =
  typeof localStorage !== "undefined" && typeof localStorage?.getItem === "function"
    ? localStorage.getItem("magix-lang") || "it"
    : "it";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: "it",
    interpolation: {
      escapeValue: false, // React già sanitizza
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
