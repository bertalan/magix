/**
 * Route slug localizzati e helper per costruire percorsi con prefisso lingua.
 *
 * Centralizza la mappatura route ↔ ViewState ↔ slug localizzato,
 * evitando link hardcoded sparsi nei componenti.
 */
import type { Lang } from "@/contexts/LanguageContext";

/** Slug locali per le rotte */
export const ROUTE_SLUGS: Record<Lang, Record<string, string>> = {
  it: {
    artists: "artisti",
    events: "eventi",
    booking: "booking",
    scout: "scout",
    press: "press-area",
    privacy: "privacy",
    terms: "termini",
    contacts: "contatti",
  },
  en: {
    artists: "artists",
    events: "events",
    booking: "booking",
    scout: "scout",
    press: "press-area",
    privacy: "privacy",
    terms: "terms",
    contacts: "contacts",
  },
};

/**
 * Costruisce un percorso localizzato con prefisso lingua.
 *
 * @example
 *   localePath("it", "privacy")          → "/it/privacy/"
 *   localePath("en", "artists", "slug")  → "/en/artists/slug/"
 *   localePath("it", "events")           → "/it/eventi/"
 */
export function localePath(lang: Lang, route: string, slug?: string): string {
  const s = ROUTE_SLUGS[lang][route] ?? route;
  return slug ? `/${lang}/${s}/${slug}/` : `/${lang}/${s}/`;
}
