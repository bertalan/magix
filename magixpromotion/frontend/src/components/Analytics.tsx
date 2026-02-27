import { useEffect, useRef } from "react";
import type { SiteAnalytics } from "@/types";

/**
 * Inietta gli script di tracking Matomo e Google Analytics
 * basandosi sulla configurazione ricevuta dal backend.
 *
 * - Matomo viene sempre caricato se matomo_url e matomo_site_id sono configurati.
 * - Google Analytics viene caricato SOLO se google_analytics_id è configurato.
 * - Entrambi tracciano automaticamente le page-view ad ogni navigazione SPA.
 */
interface AnalyticsProps {
  analytics: SiteAnalytics | undefined;
  /** Percorso corrente (per tracciare navigazioni SPA) */
  currentPath?: string;
}

export default function Analytics({ analytics, currentPath }: AnalyticsProps) {
  const matomoInjected = useRef(false);
  const gaInjected = useRef(false);

  // --- Matomo ---
  useEffect(() => {
    if (!analytics?.matomo_url || !analytics?.matomo_site_id) return;
    if (matomoInjected.current) return;
    matomoInjected.current = true;

    const _paq = ((window as any)._paq = (window as any)._paq || []);
    _paq.push(["trackPageView"]);
    _paq.push(["enableLinkTracking"]);

    const u = analytics.matomo_url.endsWith("/")
      ? analytics.matomo_url
      : analytics.matomo_url + "/";

    _paq.push(["setTrackerUrl", u + "matomo.php"]);
    _paq.push(["setSiteId", analytics.matomo_site_id]);

    const d = document;
    const g = d.createElement("script");
    const s = d.getElementsByTagName("script")[0];
    g.async = true;
    g.src = u + "matomo.js";
    s.parentNode?.insertBefore(g, s);
  }, [analytics?.matomo_url, analytics?.matomo_site_id]);

  // Matomo — traccia navigazione SPA
  useEffect(() => {
    if (!analytics?.matomo_url || !analytics?.matomo_site_id) return;
    if (!matomoInjected.current) return;

    const _paq = (window as any)._paq;
    if (_paq) {
      _paq.push(["setCustomUrl", window.location.href]);
      _paq.push(["setDocumentTitle", document.title]);
      _paq.push(["trackPageView"]);
    }
  }, [currentPath, analytics?.matomo_url, analytics?.matomo_site_id]);

  // --- Google Analytics (gtag.js) ---
  useEffect(() => {
    if (!analytics?.google_analytics_id) return;
    if (gaInjected.current) return;
    gaInjected.current = true;

    const gaId = analytics.google_analytics_id;

    // gtag.js script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // dataLayer init
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag("js", new Date());
    gtag("config", gaId, { send_page_view: true });
  }, [analytics?.google_analytics_id]);

  // Google Analytics — traccia navigazione SPA
  useEffect(() => {
    if (!analytics?.google_analytics_id) return;
    if (!gaInjected.current) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      gtag("config", analytics.google_analytics_id, {
        page_path: currentPath || window.location.pathname,
      });
    }
  }, [currentPath, analytics?.google_analytics_id]);

  // Questo componente non renderizza nulla
  return null;
}
