/* ===================================================================
 * TypeScript interfaces for Magix Promotion frontend.
 * Mirrors the shapes returned by the Django / Wagtail API endpoints.
 * =================================================================== */

// --- Navigation ---

export interface NavItem {
  title: string;
  url: string;
  openInNewTab: boolean;
  icon: string;
}

export interface MenuResponse {
  location: string;
  language: string;
  items: NavItem[];
}

// --- Artists ---

export interface ArtistSocials {
  instagram: string | null;
  spotify: string | null;
  facebook: string | null;
  website: string | null;
}

export interface MusicEvent {
  id: string;
  date: string;
  venue: string;
  city: string;
  status: "AVAILABLE" | "SOLD OUT" | "CANCELLED" | "FREE";
}

export interface Artist {
  id: number;
  meta: {
    type: string;
    detail_url: string;
    html_url: string;
    slug: string;
    first_published_at: string | null;
  };
  title: string;
  short_bio: string;
  artist_type: "show_band" | "tribute" | "original" | "dj" | "cover";
  tribute_to: string;
  hero_video_url: string;
  base_country: string;
  base_region: string;
  base_city: string;
  image_url: string | null;
  genre_display: string;
  tags: string[];
  socials: ArtistSocials;
  events: MusicEvent[];
}

// --- Events ---

export interface EventVenue {
  id: number;
  name: string;
  city: string;
  province: string;
  region: string;
  country: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
}

export interface EventPage {
  id: number;
  meta: {
    type: string;
    detail_url: string;
    html_url: string;
    slug: string;
    first_published_at: string | null;
  };
  title: string;
  start_date: string;
  end_date: string | null;
  doors_time: string | null;
  start_time: string | null;
  status: "confirmed" | "tentative" | "cancelled" | "postponed" | "sold_out";
  ticket_url: string;
  ticket_price: string;
  description: string;
  venue?: EventVenue;
  artist_name?: string;
}

// --- Wagtail API envelope ---

export interface WagtailMeta {
  total_count: number;
}

export interface WagtailListResponse<T> {
  meta: WagtailMeta;
  items: T[];
}

// --- Site Settings ---

export interface SiteAddress {
  street: string;
  city: string;
  province: string;
  zip_code: string;
  country: string;
  country_name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface SiteSocial {
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  spotify: string | null;
}

export interface SiteSettings {
  company_name: string;
  phone: string;
  email: string;
  vat_number: string;
  address: SiteAddress;
  social: SiteSocial;
}

// --- Booking ---

export interface BookingFormData {
  full_name: string;
  email: string;
  phone?: string;
  requested_artist: string;
  event_type: string;
  event_date: string;
  event_location: string;
  estimated_budget?: string;
  message?: string;
  privacy: boolean;
}

// --- View State ---

export type ViewState = "HOME" | "TALENT" | "DETAIL" | "EVENTS" | "SCOUT" | "BOOKING";
