
import { Artist, MusicEvent } from '../types';

const generateMockEvents = (artistName: string): MusicEvent[] => [
  { id: 'e1', date: 'OCT 24', venue: 'O2 Academy', city: 'London, UK', status: 'AVAILABLE' },
  { id: 'e2', date: 'NOV 12', venue: 'The Echo', city: 'Los Angeles, CA', status: 'LOW TICKETS' },
  { id: 'e3', date: 'DEC 05', venue: 'Zenith', city: 'Paris, FR', status: 'SOLD OUT' },
  { id: 'e4', date: 'JAN 18', venue: 'Brooklyn Steel', city: 'New York, NY', status: 'AVAILABLE' },
];

export const ARTISTS: Artist[] = [
  {
    id: '1',
    name: 'Red Moon',
    genre: 'Dance Show Band',
    imageUrl: 'https://picsum.photos/id/1025/800/1200',
    bio: 'sdakljhfasldkjfh dslkafh asldkjhf klajsdh fkljashd fkjashd fkjahls',
    youtubeUrl: 'https://www.youtube.com',
    socials: { spotify: '#', instagram: '#' },
    tags: ['Dance', 'Show Band', 'Live Performance'],
    events: [
      { id: 'rm-1', date: '25 JUN', venue: 'Blackhorse pub', city: 'Termenate (CO)', status: 'FREE' }
    ]
  },
  {
    id: '2',
    name: 'iPop',
    genre: 'Dance Show Band',
    imageUrl: 'https://picsum.photos/id/1027/800/1200',
    bio: 'iPop brings the ultimate party experience, delivering chart-topping hits with a unique dance-floor twist.',
    socials: { spotify: '#', instagram: '#', twitter: '#' },
    tags: ['Party', 'Dance', 'Pop Hits'],
    events: generateMockEvents('iPop')
  },
  {
    id: '3',
    name: 'THE NEON RIOT',
    genre: 'Synth-Punk',
    imageUrl: 'https://picsum.photos/id/1082/800/1200',
    bio: 'Raw energy meets analog synthesizers. The Neon Riot is the sound of a digital revolution.',
    socials: { spotify: '#', twitter: '#' },
    tags: ['Punk', 'Synth', 'High Energy'],
    events: generateMockEvents('THE NEON RIOT')
  },
  {
    id: '4',
    name: 'MIRA LOU',
    genre: 'Indie Folk',
    imageUrl: 'https://picsum.photos/id/1011/800/1200',
    bio: 'Mira Lou writes songs that feel like an old friend whisper in your ear. Acoustic, intimate, and deeply human.',
    socials: { spotify: '#', instagram: '#' },
    tags: ['Acoustic', 'Folk', 'Songwriter'],
    events: generateMockEvents('MIRA LOU')
  },
  {
    id: '5',
    name: 'DRXFT',
    genre: 'Phonk / Trap',
    imageUrl: 'https://picsum.photos/id/1050/800/1200',
    bio: 'The architect of the new underground. Heavy basslines and haunting samples.',
    socials: { spotify: '#', instagram: '#' },
    tags: ['Underground', 'Trap', 'Hard'],
    events: generateMockEvents('DRXFT')
  },
  {
    id: '6',
    name: 'LUNA SOL',
    genre: 'Dream Pop',
    imageUrl: 'https://picsum.photos/id/1041/800/1200',
    bio: 'Ethereal soundscapes and shimmering vocals. Luna Sol invites you to get lost in the stars.',
    socials: { spotify: '#', instagram: '#' },
    tags: ['Dreamy', 'Pop', 'Ambient'],
    events: generateMockEvents('LUNA SOL')
  }
];
