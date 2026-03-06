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
  slug: string;
  date: string;
  venue: string;
  city: string;
  status: "AVAILABLE" | "SOLD OUT" | "CANCELLED" | "FREE";
}

export interface EPKAssets {
  photo: string | null;
  rider: string | null;
  bio: string | null;
  logo: string | null;
  zip: string | null;
}

export interface EPKSummary {
  id: number;
  title: string;
  description: string;
  updated_at: string;
  assets: EPKAssets;
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
  image_thumb: string | null;
  gallery_images: string[];
  gallery_thumbs: string[];
  genre_display: string;
  tags: string[];
  socials: ArtistSocials;
  events: MusicEvent[];
  epk: EPKSummary | null;
  body_html: string;
}

// --- Events ---

export interface EventArtist {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  image_thumb: string | null;
  gallery_images: string[];
  gallery_thumbs: string[];
}

export interface EventVenue {
  id: number;
  name: string;
  city: string;
  region: string;
  country: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  navigation_url: string | null;
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
  artist?: EventArtist;
  featured_image_url?: string | null;
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

export interface SiteAnalytics {
  matomo_url: string;
  matomo_site_id: string;
  google_analytics_id: string;
}

export interface SiteSettings {
  company_name: string;
  phone: string;
  email: string;
  vat_number: string;
  address: SiteAddress;
  social: SiteSocial;
  analytics: SiteAnalytics;
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

// --- Press Area ---

export interface EPKListItem {
  id: number;
  title: string;
  description: string;
  updated_at: string;
  is_company: boolean;
  assets: EPKAssets;
  artist: {
    id: number;
    title: string;
    slug: string;
  } | null;
}

export interface PressAreaIntro {
  title: string;
  subtitle: string;
  intro_text: string;
  company_epk_id: number | null;
}

export interface PressAreaData {
  intro: PressAreaIntro | null;
  items: EPKListItem[];
}

// --- View State ---

export type ViewState = "HOME" | "TALENT" | "DETAIL" | "EVENTS" | "SCOUT" | "BOOKING" | "PRESS" | "PRIVACY" | "TERMS" | "CONTACTS" | "NOT_FOUND";
