import React from "react";
import { ViewState, Artist, EventPage } from "@/types";
import { fetchArtistBySlug, fetchArtist, fetchEventBySlug } from "@/lib/api";
import { useLanguage, Lang } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Layout from "./components/Layout";
import HomePage from "./components/HomePage";
import ArtistGrid from "./components/ArtistGrid";
import ArtistDetail from "./components/ArtistDetail";
import EventDetail from "./components/EventDetail";
import EventsPage from "./components/EventsPage";
import Analytics from "./components/Analytics";
import BookingPage from "./components/BookingPage";
import BandFinder from "./components/BandFinder";
import PrivacyPage from "./components/PrivacyPage";
import TermsPage from "./components/TermsPage";
import ContactsPage from "./components/ContactsPage";

/** Slug locali per le rotte */
const ROUTE_SLUGS: Record<Lang, Record<string, string>> = {
  it: {
    artists: "artisti",
    events: "eventi",
    booking: "booking",
    scout: "scout",
    privacy: "privacy",
    terms: "termini",
    contacts: "contatti",
  },
  en: {
    artists: "artists",
    events: "events",
    booking: "booking",
    scout: "scout",
    privacy: "privacy",
    terms: "terms",
    contacts: "contacts",
  },
};

/** Parse the URL path to detect an artist slug (/it/artisti/:slug or /en/artists/:slug). */
function parseArtistSlugFromPath(): string | null {
  const match = window.location.pathname.match(/\/(?:it\/artisti|en\/artists)\/([^/]+)/);
  return match ? match[1] : null;
}

/** Parse the URL path to detect an event slug (/it/eventi/:slug or /en/events/:slug). */
function parseEventSlugFromPath(): string | null {
  const match = window.location.pathname.match(/\/(?:it\/eventi|en\/events)\/([^/]+)/);
  return match ? match[1] : null;
}

/** Detect language from URL path prefix. */
function parseLangFromPath(): Lang {
  const match = window.location.pathname.match(/^\/(it|en)\//);
  return match && match[1] === "en" ? "en" : "it";
}

/** Detect the initial ViewState from the current URL path. */
function parseViewFromPath(): ViewState {
  const path = window.location.pathname;
  if (/\/(?:it\/artisti|en\/artists)\/[^/]+/.test(path)) return "DETAIL";
  if (/\/(?:it\/artisti|en\/artists)\/?$/.test(path)) return "TALENT";
  if (/\/(?:it\/eventi|en\/events)(?:\/|$)/.test(path)) return "EVENTS";
  if (/\/(?:it|en)\/booking\/?$/.test(path)) return "BOOKING";
  if (/\/(?:it|en)\/scout\/?$/.test(path)) return "SCOUT";
  if (/\/(?:it\/privacy|en\/privacy)\/?$/.test(path)) return "PRIVACY";
  if (/\/(?:it\/termini|en\/terms)\/?$/.test(path)) return "TERMS";
  if (/\/(?:it\/contatti|en\/contacts)\/?$/.test(path)) return "CONTACTS";
  return "HOME";
}

/** Map ViewState to a URL path for pushState. */
function viewToPath(view: ViewState, lang: Lang, slug?: string): string {
  const s = ROUTE_SLUGS[lang];
  switch (view) {
    case "DETAIL":
      return slug ? `/${lang}/${s.artists}/${slug}/` : "/";
    case "TALENT":
      return `/${lang}/${s.artists}/`;
    case "EVENTS":
      return slug ? `/${lang}/${s.events}/${slug}/` : `/${lang}/${s.events}/`;
    case "BOOKING":
      return `/${lang}/${s.booking}/`;
    case "SCOUT":
      return `/${lang}/${s.scout}/`;
    case "PRIVACY":
      return `/${lang}/${s.privacy}/`;
    case "TERMS":
      return `/${lang}/${s.terms}/`;
    case "CONTACTS":
      return `/${lang}/${s.contacts}/`;
    default:
      return "/";
  }
}

const App: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const { data: siteSettings } = useSiteSettings();
  const [activeView, setActiveView] = React.useState<ViewState>(() => parseViewFromPath());
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(
    null,
  );
  const [loadingArtist, setLoadingArtist] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState<
    "electric-night" | "pastel-dream"
  >(() => {
    const saved = localStorage.getItem("magix-theme");
    return saved === "pastel-dream" ? "pastel-dream" : "electric-night";
  });

  const [bookingArtistName, setBookingArtistName] = React.useState<
    string | undefined
  >(undefined);

  const [highlightedEventSlug, setHighlightedEventSlug] = React.useState<
    string | null
  >(null);

  const [selectedEvent, setSelectedEvent] = React.useState<EventPage | null>(
    null,
  );
  const [loadingEvent, setLoadingEvent] = React.useState(false);

  // --- URL-based routing on mount ---
  React.useEffect(() => {
    // Sincronizza lingua da URL se presente
    const urlLang = parseLangFromPath();
    if (urlLang !== lang) setLang(urlLang);

    const artistSlug = parseArtistSlugFromPath();
    if (artistSlug) {
      setLoadingArtist(true);
      fetchArtistBySlug(artistSlug)
        .then((artist) => {
          if (artist) {
            setSelectedArtist(artist);
            setActiveView("DETAIL");
          }
        })
        .finally(() => setLoadingArtist(false));
      return;
    }

    const eventSlug = parseEventSlugFromPath();
    if (eventSlug) {
      // Fetch the event and open the detail page
      setLoadingEvent(true);
      fetchEventBySlug(eventSlug)
        .then((event) => {
          if (event) {
            setSelectedEvent(event);
            setActiveView("EVENTS");
          }
        })
        .finally(() => setLoadingEvent(false));
    }
  }, []);

  // --- Sync URL with view changes ---
  const pushUrl = React.useCallback((view: ViewState, slug?: string) => {
    const newPath = viewToPath(view, lang, slug);
    if (window.location.pathname !== newPath) {
      window.history.pushState({ view, slug, lang }, "", newPath);
    }
  }, [lang]);

  // --- Handle browser back/forward ---
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as { view?: ViewState; slug?: string; lang?: Lang } | null;
      // Sincronizza lingua dallo stato o dall'URL
      const stateLang = state?.lang || parseLangFromPath();
      if (stateLang !== lang) setLang(stateLang);

      if (state?.view === "DETAIL" && state.slug) {
        fetchArtistBySlug(state.slug).then((artist) => {
          if (artist) {
            setSelectedArtist(artist);
            setActiveView("DETAIL");
          }
        });
      } else if (state?.view === "EVENTS" && state.slug) {
        setSelectedArtist(null);
        fetchEventBySlug(state.slug).then((event) => {
          if (event) {
            setSelectedEvent(event);
            setActiveView("EVENTS");
          }
        });
      } else if (state?.view) {
        setSelectedArtist(null);
        setSelectedEvent(null);
        setHighlightedEventSlug(null);
        setActiveView(state.view);
      } else {
        setSelectedArtist(null);
        setSelectedEvent(null);
        setHighlightedEventSlug(null);
        setActiveView("HOME");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Applica il tema al document
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("magix-theme", currentTheme);
  }, [currentTheme]);

  // Aggiorna l'URL quando cambia la lingua
  React.useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    // Ricostruisce il path con la nuova lingua
    const currentSlug = selectedArtist?.meta?.slug || selectedEvent?.meta?.slug;
    const newPath = viewToPath(activeView, lang, currentSlug);
    if (window.location.pathname !== newPath && activeView !== "HOME") {
      window.history.replaceState({ view: activeView, slug: currentSlug, lang }, "", newPath);
    }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = () => {
    setCurrentTheme((prev) =>
      prev === "electric-night" ? "pastel-dream" : "electric-night",
    );
  };

  const setView = (view: ViewState) => {
    setActiveView(view);
    if (view !== "DETAIL") {
      setSelectedArtist(null);
    }
    if (view !== "BOOKING") {
      setBookingArtistName(undefined);
    }
    if (view !== "EVENTS") {
      setHighlightedEventSlug(null);
      setSelectedEvent(null);
    }
    pushUrl(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setActiveView("DETAIL");
    pushUrl("DETAIL", artist.meta.slug);
  };

  /** Open artist detail by ID (e.g. from EventCard). Fetches full artist first. */
  const handleArtistClickById = (artistId: number) => {
    setLoadingArtist(true);
    fetchArtist(artistId)
      .then((artist) => {
        setSelectedArtist(artist);
        setActiveView("DETAIL");
        pushUrl("DETAIL", artist.meta.slug);
      })
      .finally(() => setLoadingArtist(false));
  };

  const handleCloseDetail = () => {
    setSelectedArtist(null);
    setActiveView("TALENT");
    pushUrl("TALENT");
  };

  /** Apri dettaglio evento da EventCard click */
  const handleEventClick = (event: EventPage) => {
    setSelectedEvent(event);
    setActiveView("EVENTS");
    pushUrl("EVENTS", event.meta.slug);
  };

  /** Apri dettaglio evento da slug (es. da ArtistDetail). Fetcha l'evento completo. */
  const handleEventClickBySlug = (slug: string) => {
    setLoadingEvent(true);
    fetchEventBySlug(slug)
      .then((ev) => {
        if (ev) {
          setSelectedEvent(ev);
          setActiveView("EVENTS");
          pushUrl("EVENTS", slug);
        }
      })
      .finally(() => setLoadingEvent(false));
  };

  const handleCloseEventDetail = () => {
    setSelectedEvent(null);
    setActiveView("EVENTS");
    pushUrl("EVENTS");
  };

  /** Naviga a Booking con artista preselezionato (da ArtistDetail o EventDetail) */
  const handleBookArtist = (artistName: string) => {
    setBookingArtistName(artistName);
    setSelectedArtist(null);
    setSelectedEvent(null);
    setActiveView("BOOKING");
    pushUrl("BOOKING");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderView = () => {
    switch (activeView) {
      case "HOME":
        return (
          <HomePage setView={setView} onArtistClick={handleArtistClick} />
        );

      case "TALENT":
        return <ArtistGrid onArtistClick={handleArtistClick} />;

      case "EVENTS":
        return <EventsPage setView={setView} onArtistClick={handleArtistClickById} onEventClick={handleEventClick} highlightedEventSlug={highlightedEventSlug} />;

      case "SCOUT":
        return <BandFinder onArtistSelect={handleArtistClick} />;

      case "BOOKING":
        return (
          <BookingPage
            preselectedArtist={bookingArtistName}
          />
        );

      case "PRIVACY":
        return <PrivacyPage />;

      case "TERMS":
        return <TermsPage />;

      case "CONTACTS":
        return <ContactsPage />;

      default:
        return (
          <HomePage setView={setView} onArtistClick={handleArtistClick} />
        );
    }
  };

  return (
    <Layout
      activeView={activeView}
      setView={setView}
      currentTheme={currentTheme}
      toggleTheme={toggleTheme}
    >
      {/* Analytics tracking — inietta Matomo / GA in base alla config del backend */}
      <Analytics
        analytics={siteSettings?.analytics}
        currentPath={window.location.pathname}
      />

      {renderView()}

      {/* EventDetail overlay */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={handleCloseEventDetail}
          onArtistClick={handleArtistClickById}
          onEventClick={handleEventClick}
          onBookArtist={handleBookArtist}
          setView={setView}
        />
      )}

      {/* Loading overlay when fetching artist or event from URL */}
      {(loadingArtist || loadingEvent) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--bg-color)]">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ArtistDetail overlay (renders on top when DETAIL view is active) */}
      {activeView === "DETAIL" && selectedArtist && (
        <ArtistDetail
          artist={selectedArtist}
          onClose={handleCloseDetail}
          setView={setView}
          onBookArtist={handleBookArtist}
          onEventClick={handleEventClickBySlug}
        />
      )}
    </Layout>
  );
};

export default App;
