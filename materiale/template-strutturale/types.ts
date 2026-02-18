
export interface MusicEvent {
  id: string;
  date: string;
  venue: string;
  city: string;
  status: 'AVAILABLE' | 'SOLD OUT' | 'LOW TICKETS' | 'FREE';
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  imageUrl: string;
  bio: string;
  youtubeUrl?: string;
  socials: {
    instagram?: string;
    spotify?: string;
    twitter?: string;
  };
  tags: string[];
  events: MusicEvent[];
}

export interface NavItem {
  label: string;
  href: string;
}

export type ViewState = 'HOME' | 'TALENT' | 'DETAIL' | 'SCOUT';
