import React from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "music.musician" | "music.event";
}

/**
 * Componente per gestire meta tag dinamici via document.head.
 * In una SPA senza SSR, usa useEffect per aggiornare i meta tag.
 *
 * Utile per social preview (Open Graph, Twitter Cards).
 * Per SEO reale, i meta tags sono generati server-side da Django.
 */
const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  url,
  type = "website",
}) => {
  const { data: settings } = useSiteSettings();
  const siteName = settings?.company_name || "Magix Promotion";

  React.useEffect(() => {
    // Title
    document.title = `${title} | ${siteName}`;

    // Meta tags
    const metas: Record<string, string> = {
      description: description,
      "og:title": title,
      "og:description": description,
      "og:type": type,
      "og:site_name": siteName,
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
    };
    if (image) {
      metas["og:image"] = image;
      metas["twitter:image"] = image;
    }
    if (url) {
      metas["og:url"] = url;
    }

    Object.entries(metas).forEach(([name, content]) => {
      const attr =
        name.startsWith("og:") || name.startsWith("twitter:")
          ? "property"
          : "name";
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
  }, [title, description, image, url, type, siteName]);

  return null;
};

export default SEOHead;
