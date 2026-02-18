/* ===================================================================
 * Mock data fixtures for tests.
 * Mirrors the shapes returned by the Wagtail API.
 * =================================================================== */

import type {
  Artist,
  EventPage,
  MenuResponse,
  SiteSettings,
  WagtailListResponse,
} from "@/types";

// --- Artists ---

export const mockArtist: Artist = {
  id: 1,
  meta: {
    type: "artists.ArtistPage",
    detail_url: "http://localhost:8000/api/v2/artists/1/",
    html_url: "http://localhost:8000/artisti/the-groove-machine/",
    slug: "the-groove-machine",
    first_published_at: "2024-01-15T10:00:00Z",
  },
  title: "The Groove Machine",
  short_bio: "La dance show band piu' travolgente del nord Italia.",
  artist_type: "show_band",
  tribute_to: "",
  hero_video_url: "",
  base_country: "IT",
  base_region: "Piemonte",
  base_city: "Novi Ligure",
  image_url: "/media/images/groove-machine.jpg",
  genre_display: "Dance / Pop",
  tags: ["matrimonio", "festival", "corporate"],
  socials: {
    instagram: "https://instagram.com/groovemachine",
    spotify: "https://open.spotify.com/artist/123",
    facebook: null,
    website: "https://groovemachine.it",
  },
  events: [
    {
      id: "ev1",
      date: "2025-06-15",
      venue: "Piazza Duomo",
      city: "Milano",
      status: "AVAILABLE",
    },
  ],
};

export const mockArtist2: Artist = {
  id: 2,
  meta: {
    type: "artists.ArtistPage",
    detail_url: "http://localhost:8000/api/v2/artists/2/",
    html_url: "http://localhost:8000/artisti/queen-tribute/",
    slug: "queen-tribute",
    first_published_at: "2024-02-20T10:00:00Z",
  },
  title: "Queen Forever",
  short_bio: "Il tributo ai Queen piu' fedele d'Italia.",
  artist_type: "tribute",
  tribute_to: "Queen",
  hero_video_url: "",
  base_country: "IT",
  base_region: "Lombardia",
  base_city: "Milano",
  image_url: "/media/images/queen-forever.jpg",
  genre_display: "Rock",
  tags: ["tributo", "rock", "festival"],
  socials: {
    instagram: null,
    spotify: null,
    facebook: "https://facebook.com/queenforever",
    website: null,
  },
  events: [],
};

export const mockArtistsResponse: WagtailListResponse<Artist> = {
  meta: { total_count: 2 },
  items: [mockArtist, mockArtist2],
};

// --- Events ---

export const mockEvent: EventPage = {
  id: 10,
  meta: {
    type: "events.EventPage",
    detail_url: "http://localhost:8000/api/v2/events/10/",
    html_url: "http://localhost:8000/eventi/concerto-piazza-duomo/",
    slug: "concerto-piazza-duomo",
    first_published_at: "2024-03-01T10:00:00Z",
  },
  title: "Concerto in Piazza Duomo",
  start_date: "2025-07-20",
  end_date: null,
  doors_time: "20:00:00",
  start_time: "21:00:00",
  status: "confirmed",
  ticket_url: "https://tickets.example.com/event/10",
  ticket_price: "25.00",
  description: "Una serata di musica dal vivo in piazza.",
  venue: {
    id: 1,
    name: "Piazza Duomo",
    city: "Milano",
    region: "Lombardia",
    country: "IT",
    address: "Piazza del Duomo, 1",
    latitude: 45.4642,
    longitude: 9.1900,
    navigation_url: null,
  },
  artist: {
    id: 1,
    name: "The Groove Machine",
    slug: "the-groove-machine",
    image_url: null,
  },
  featured_image_url: null,
};

export const mockEventSoldOut: EventPage = {
  id: 11,
  meta: {
    type: "events.EventPage",
    detail_url: "http://localhost:8000/api/v2/events/11/",
    html_url: "http://localhost:8000/eventi/sold-out-show/",
    slug: "sold-out-show",
    first_published_at: "2024-03-15T10:00:00Z",
  },
  title: "Rock Night Sold Out",
  start_date: "2025-08-10",
  end_date: null,
  doors_time: null,
  start_time: "22:00:00",
  status: "sold_out",
  ticket_url: "",
  ticket_price: "35.00",
  description: "Evento sold out!",
  venue: {
    id: 2,
    name: "Arena di Verona",
    city: "Verona",
    region: "Veneto",
    country: "IT",
    address: "Piazza Bra, 1",
    latitude: 45.4395,
    longitude: 10.9944,
    navigation_url: null,
  },
  artist: {
    id: 2,
    name: "Queen Forever",
    slug: "queen-forever",
    image_url: null,
  },
  featured_image_url: null,
};

export const mockEventsResponse: WagtailListResponse<EventPage> = {
  meta: { total_count: 2 },
  items: [mockEvent, mockEventSoldOut],
};

// --- Menu ---

export const mockMenuResponse: MenuResponse = {
  location: "main",
  language: "it",
  items: [
    { title: "Home", url: "/", openInNewTab: false, icon: "" },
    { title: "Artisti", url: "/artisti", openInNewTab: false, icon: "" },
    { title: "Eventi", url: "/eventi", openInNewTab: false, icon: "" },
    { title: "Contatti", url: "/contatti", openInNewTab: false, icon: "" },
  ],
};

// --- Site Settings ---

export const mockSiteSettings: SiteSettings = {
  company_name: "Magix Promotion",
  phone: "+39 0143 123456",
  email: "info@magixpromotion.it",
  vat_number: "IT01234567890",
  address: {
    street: "Via Roma 1",
    city: "Novi Ligure",
    province: "AL",
    zip_code: "15067",
    country: "IT",
    country_name: "Italia",
    latitude: 44.7631,
    longitude: 8.7869,
  },
  social: {
    facebook: "https://facebook.com/magixpromotion",
    instagram: "https://instagram.com/magixpromotion",
    youtube: null,
    spotify: null,
  },
};

// --- Search ---

export const mockSearchResults = {
  results: [
    {
      type: "artist" as const,
      id: 1,
      title: "The Groove Machine",
      slug: "the-groove-machine",
      genre: "Dance / Pop",
      image_url: "/media/images/groove-machine.jpg",
    },
    {
      type: "event" as const,
      id: 10,
      title: "Concerto in Piazza Duomo",
      slug: "concerto-piazza-duomo",
      start_date: "2025-07-20",
      venue_name: "Piazza Duomo",
      city: "Milano",
    },
  ],
};

export const mockAutocompleteSuggestions = {
  suggestions: [
    { id: 1, name: "The Groove Machine", slug: "the-groove-machine", genre: "Dance / Pop" },
    { id: 2, name: "Queen Forever", slug: "queen-forever", genre: "Rock" },
  ],
};
