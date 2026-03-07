import React from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage, Lang } from "@/contexts/LanguageContext";
import { ROUTE_SLUGS } from "@/lib/routes";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "music.musician" | "music.event";
  /** Set noindex for pages like 404, scout, etc. */
  noindex?: boolean;
}

const SITE_URL = "https://new.magixpromotion.com";

/**
 * Componente per gestire meta tag dinamici via document.head.
 * Imposta: title, description, OG, Twitter Cards, canonical, hreflang, robots.
 *
 * Per i crawler reali i meta sono generati server-side da Django (via Nginx bot-detection).
 * Questo componente copre Googlebot (esegue JS) e utenti reali.
 */
const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  url,
  type = "website",
  noindex = false,
}) => {
  const { data: settings } = useSiteSettings();
  const { lang } = useLanguage();
  const siteName = settings?.company_name || "Magix Promotion";

  React.useEffect(() => {
    // Title
    document.title = `${title} | ${siteName}`;

    // ─── Meta tags ───
    const metas: Record<string, string> = {
      description: description,
      // Open Graph
      "og:title": title,
      "og:description": description,
      "og:type": type,
      "og:site_name": siteName,
      "og:locale": lang === "en" ? "en_US" : "it_IT",
      "og:locale:alternate": lang === "en" ? "it_IT" : "en_US",
      // Twitter Cards (use name attr, not property)
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
    };

    if (image) {
      metas["og:image"] = image;
      metas["twitter:image"] = image;
    }

    const currentUrl = url || `${SITE_URL}${window.location.pathname}`;
    metas["og:url"] = currentUrl;

    if (noindex) {
      metas["robots"] = "noindex, nofollow";
    }

    Object.entries(metas).forEach(([name, content]) => {
      // Twitter tags use name=, OG tags use property=
      const isOg = name.startsWith("og:");
      const attr = isOg ? "property" : "name";
      let el = document.querySelector(
        `meta[${attr}="${name}"]`
      ) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    });

    // ─── Canonical URL ───
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

    // ─── Hreflang alternates (it ↔ en) ───
    const altLang: Lang = lang === "en" ? "it" : "en";
    const altPath = buildAlternatePath(window.location.pathname, lang, altLang);

    setHreflang(lang, `${SITE_URL}${window.location.pathname}`);
    setHreflang(altLang, `${SITE_URL}${altPath}`);
    setHreflang("x-default", `${SITE_URL}${window.location.pathname}`);

    // Cleanup: remove noindex when component re-renders without it
    if (!noindex) {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.remove();
    }
  }, [title, description, image, url, type, siteName, lang, noindex]);

  return null;
};

/** Set or create a <link rel="alternate" hreflang="..."> tag. */
function setHreflang(langCode: string, href: string) {
  let el = document.querySelector(`link[hreflang="${langCode}"]`) as HTMLLinkElement;
  if (!el) {
    el = document.createElement("link");
    el.rel = "alternate";
    el.setAttribute("hreflang", langCode);
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Build the alternate-language path by swapping route slugs.
 * e.g. /it/artisti/my-band/ → /en/artists/my-band/
 */
function buildAlternatePath(path: string, fromLang: Lang, toLang: Lang): string {
  let result = path.replace(`/${fromLang}/`, `/${toLang}/`);
  const fromSlugs = ROUTE_SLUGS[fromLang];
  const toSlugs = ROUTE_SLUGS[toLang];
  for (const key of Object.keys(fromSlugs)) {
    if (fromSlugs[key] !== toSlugs[key]) {
      result = result.replace(`/${fromSlugs[key]}/`, `/${toSlugs[key]}/`);
    }
  }
  return result;
}

export default SEOHead;
