import React from "react";
import { Artist, EventPage, SiteSettings } from "@/types";
import { ROUTE_SLUGS } from "@/lib/routes";

/**
 * Inietta un <script type="application/ld+json"> nel DOM.
 * Googlebot esegue JavaScript e legge JSON-LD iniettato dinamicamente.
 * Rimuove lo script precedente quando il componente viene smontato o i dati cambiano.
 */

const JSONLD_SCRIPT_ID = "magix-jsonld";

function injectJsonLd(data: Record<string, unknown>) {
  // Rimuovi script precedente
  const existing = document.getElementById(JSONLD_SCRIPT_ID);
  if (existing) existing.remove();

  const script = document.createElement("script");
  script.id = JSONLD_SCRIPT_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function removeJsonLd() {
  const existing = document.getElementById(JSONLD_SCRIPT_ID);
  if (existing) existing.remove();
}

// ---- Generatori JSON-LD ----

/** Schema.org/MusicGroup per un artista. */
export function artistToJsonLd(artist: Artist, siteUrl = "https://www.magixpromotion.com", lang: "it" | "en" = "it"): Record<string, unknown> {
  const slugs = ROUTE_SLUGS[lang];
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": artist.title,
    "description": artist.short_bio?.slice(0, 200) || "",
    "url": `${siteUrl}/${lang}/${slugs.artists}/${artist.meta.slug}/`,
    "genre": artist.genre_display ? [artist.genre_display] : [],
  };

  if (artist.image_url) {
    data["image"] = artist.image_url;
  }

  if (artist.hero_video_url) {
    data["video"] = {
      "@type": "VideoObject",
      "url": artist.hero_video_url,
      "name": `Video promo ${artist.title}`,
    };
  }

  const sameAs: string[] = [];
  if (artist.socials?.instagram) sameAs.push(artist.socials.instagram);
  if (artist.socials?.facebook) sameAs.push(artist.socials.facebook);
  if (artist.socials?.spotify) sameAs.push(artist.socials.spotify);
  if (artist.socials?.website) sameAs.push(artist.socials.website);
  if (sameAs.length > 0) data["sameAs"] = sameAs;

  // Prossimi eventi
  if (artist.events && artist.events.length > 0) {
    data["event"] = artist.events.slice(0, 5).map((ev) => ({
      "@type": "MusicEvent",
      "name": ev.venue ? `${artist.title} @ ${ev.venue}` : artist.title,
      "startDate": ev.date,
      "location": {
        "@type": "Place",
        "name": ev.venue || "",
        "address": { "@type": "PostalAddress", "addressLocality": ev.city || "" },
      },
    }));
  }

  return data;
}

/** Schema.org/MusicEvent per un evento. */
export function eventToJsonLd(event: EventPage, siteUrl = "https://www.magixpromotion.com", lang: "it" | "en" = "it"): Record<string, unknown> {
  const statusMap: Record<string, string> = {
    confirmed: "https://schema.org/EventScheduled",
    tentative: "https://schema.org/EventScheduled",
    cancelled: "https://schema.org/EventCancelled",
    postponed: "https://schema.org/EventPostponed",
    sold_out: "https://schema.org/EventScheduled",
  };

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    "name": event.title,
    "startDate": event.start_date,
    "url": `${siteUrl}/${lang}/${ROUTE_SLUGS[lang].events}/${event.meta.slug}/`,
    "eventStatus": statusMap[event.status] || "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  };

  if (event.end_date) {
    data["endDate"] = event.end_date;
  }

  // Venue / Location
  if (event.venue) {
    const location: Record<string, unknown> = {
      "@type": "Place",
      "name": event.venue.name,
    };
    if (event.venue.city) {
      location["address"] = {
        "@type": "PostalAddress",
        "addressLocality": event.venue.city,
        "addressRegion": event.venue.region || "",
        "addressCountry": event.venue.country || "IT",
      };
    }
    if (event.venue.latitude && event.venue.longitude) {
      location["geo"] = {
        "@type": "GeoCoordinates",
        "latitude": event.venue.latitude,
        "longitude": event.venue.longitude,
      };
    }
    data["location"] = location;
  }

  // Performer
  if (event.artist) {
    data["performer"] = {
      "@type": "MusicGroup",
      "name": event.artist.name,
      "url": `${siteUrl}/${lang}/${ROUTE_SLUGS[lang].artists}/${event.artist.slug}/`,
    };
  }

  // Organizer
  data["organizer"] = {
    "@type": "Organization",
    "name": "Magix Promotion",
    "url": siteUrl,
  };

  // Offerta biglietti
  if (event.ticket_url) {
    const offers: Record<string, unknown> = {
      "@type": "Offer",
      "url": event.ticket_url,
      "availability": event.status === "sold_out"
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
    };
    if (event.ticket_price) offers["price"] = event.ticket_price;
    data["offers"] = offers;
  }

  // Immagine
  if (event.featured_image_url) {
    data["image"] = event.featured_image_url;
  }

  return data;
}

/**
 * Schema.org/ItemList di MusicGroup per la pagina roster artisti.
 * Google può generare rich results carousel da una ItemList.
 * Include al massimo 50 elementi (limite ragionevole per structured data).
 */
export function rosterToJsonLd(
  artists: Artist[],
  totalCount: number,
  siteUrl = "https://www.magixpromotion.com",
  lang: "it" | "en" = "it",
): Record<string, unknown> {
  const slugs = ROUTE_SLUGS[lang];
  const listName = lang === "it"
    ? "Roster Artisti — Magix Promotion"
    : "Artist Roster — Magix Promotion";

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "description": lang === "it"
      ? "Band e artisti musicali per eventi, concerti e feste private."
      : "Bands and music artists for events, concerts and private parties.",
    "url": `${siteUrl}/${lang}/${slugs.artists}/`,
    "numberOfItems": totalCount,
    "itemListElement": artists.slice(0, 50).map((artist, index) => {
      const item: Record<string, unknown> = {
        "@type": "MusicGroup",
        "name": artist.title,
        "url": `${siteUrl}/${lang}/${slugs.artists}/${artist.meta.slug}/`,
      };
      if (artist.image_url) item["image"] = artist.image_url;
      if (artist.genre_display) item["genre"] = [artist.genre_display];
      if (artist.short_bio) item["description"] = artist.short_bio.slice(0, 160);
      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": item,
      };
    }),
  };
}

/**
 * Schema.org/ItemList di MusicEvent per la pagina lista eventi.
 * Include al massimo 50 elementi.
 */
export function eventsListToJsonLd(
  events: EventPage[],
  totalCount: number,
  siteUrl = "https://www.magixpromotion.com",
  lang: "it" | "en" = "it",
): Record<string, unknown> {
  const slugs = ROUTE_SLUGS[lang];
  const listName = lang === "it"
    ? "Eventi — Magix Promotion"
    : "Events — Magix Promotion";

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "description": lang === "it"
      ? "Tutte le date live delle nostre band e artisti."
      : "All live dates of our bands and artists.",
    "url": `${siteUrl}/${lang}/${slugs.events}/`,
    "numberOfItems": totalCount,
    "itemListElement": events.slice(0, 50).map((event, index) => {
      const item: Record<string, unknown> = {
        "@type": "MusicEvent",
        "name": event.title,
        "startDate": event.start_date,
        "url": `${siteUrl}/${lang}/${slugs.events}/${event.meta.slug}/`,
      };
      if (event.venue) {
        item["location"] = {
          "@type": "Place",
          "name": event.venue.name,
          ...(event.venue.city ? {
            "address": {
              "@type": "PostalAddress",
              "addressLocality": event.venue.city,
              "addressCountry": event.venue.country || "IT",
            },
          } : {}),
        };
      }
      if (event.artist) {
        item["performer"] = {
          "@type": "MusicGroup",
          "name": event.artist.name,
        };
      }
      if (event.featured_image_url) item["image"] = event.featured_image_url;
      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": item,
      };
    }),
  };
}

/** Schema.org/EntertainmentBusiness per la homepage. */
export function homepageToJsonLd(settings?: SiteSettings | null, siteUrl = "https://www.magixpromotion.com"): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EntertainmentBusiness",
    "name": settings?.company_name || "Magix Promotion",
    "description": "Agenzia di band e artisti musicali per eventi in Italia e nel mondo.",
    "url": siteUrl,
    "telephone": settings?.phone || "+39 335 523 0855",
    "email": settings?.email || "info@magixpromotion.it",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": settings?.address?.street || "Via dello Scabiolo",
      "addressLocality": settings?.address?.city || "Novi Ligure",
      "postalCode": settings?.address?.zip_code || "15067",
      "addressRegion": settings?.address?.province || "AL",
      "addressCountry": settings?.address?.country || "IT",
    },
    "priceRange": "$$",
    "knowsLanguage": ["it", "en"],
  };

  if (settings?.address?.latitude && settings?.address?.longitude) {
    data["geo"] = {
      "@type": "GeoCoordinates",
      "latitude": settings.address.latitude,
      "longitude": settings.address.longitude,
    };
  }

  const sameAs: string[] = [];
  if (settings?.social?.facebook) sameAs.push(settings.social.facebook);
  if (settings?.social?.instagram) sameAs.push(settings.social.instagram);
  if (settings?.social?.youtube) sameAs.push(settings.social.youtube);
  if (settings?.social?.spotify) sameAs.push(settings.social.spotify);
  if (sameAs.length > 0) data["sameAs"] = sameAs;

  return data;
}

// ---- Componenti React ----

/** Inietta JSON-LD per un artista. */
export const ArtistJsonLd: React.FC<{ artist: Artist; lang?: "it" | "en" }> = ({ artist, lang = "it" }) => {
  React.useEffect(() => {
    injectJsonLd(artistToJsonLd(artist, undefined, lang));
    return removeJsonLd;
  }, [artist.id, lang]);
  return null;
};

/** Inietta JSON-LD per un evento. */
export const EventJsonLd: React.FC<{ event: EventPage; lang?: "it" | "en" }> = ({ event, lang = "it" }) => {
  React.useEffect(() => {
    injectJsonLd(eventToJsonLd(event, undefined, lang));
    return removeJsonLd;
  }, [event.id, lang]);
  return null;
};

/** Inietta JSON-LD per la homepage. */
export const HomepageJsonLd: React.FC<{ settings?: SiteSettings | null }> = ({ settings }) => {
  React.useEffect(() => {
    injectJsonLd(homepageToJsonLd(settings));
    return removeJsonLd;
  }, [settings?.company_name]);
  return null;
};

/** Inietta JSON-LD ItemList per la pagina roster artisti. */
export const RosterJsonLd: React.FC<{ artists: Artist[]; totalCount: number; lang?: "it" | "en" }> = ({ artists, totalCount, lang = "it" }) => {
  React.useEffect(() => {
    if (artists.length === 0) return;
    injectJsonLd(rosterToJsonLd(artists, totalCount, undefined, lang));
    return removeJsonLd;
  }, [artists.length, totalCount, lang]);
  return null;
};

/** Inietta JSON-LD ItemList per la pagina lista eventi. */
export const EventsListJsonLd: React.FC<{ events: EventPage[]; totalCount: number; lang?: "it" | "en" }> = ({ events, totalCount, lang = "it" }) => {
  React.useEffect(() => {
    if (events.length === 0) return;
    injectJsonLd(eventsListToJsonLd(events, totalCount, undefined, lang));
    return removeJsonLd;
  }, [events.length, totalCount, lang]);
  return null;
};
