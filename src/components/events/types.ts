export type TcgEventGame = 'pokemon' | 'magic' | 'yugioh' | 'onepiece' | 'lorcana';
export type EventStatus = 'upcoming' | 'open_registration' | 'sold_out' | 'live' | 'completed';

export interface TournamentEvent {
  id: string;
  game_type: TcgEventGame;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  external_link: string | null;
  is_major: boolean;
  status: EventStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameConfig {
  id: TcgEventGame;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const GAME_CONFIGS: Record<TcgEventGame, GameConfig> = {
  pokemon: {
    id: 'pokemon',
    name: 'Pokémon',
    color: 'hsl(210, 100%, 50%)',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    icon: '⚡'
  },
  magic: {
    id: 'magic',
    name: 'Magic: The Gathering',
    color: 'hsl(30, 100%, 50%)',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    icon: '🔮'
  },
  yugioh: {
    id: 'yugioh',
    name: 'Yu-Gi-Oh!',
    color: 'hsl(45, 100%, 50%)',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    icon: '👁️'
  },
  onepiece: {
    id: 'onepiece',
    name: 'One Piece',
    color: 'hsl(0, 100%, 50%)',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    icon: '🏴‍☠️'
  },
  lorcana: {
    id: 'lorcana',
    name: 'Disney Lorcana',
    color: 'hsl(270, 100%, 60%)',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
    icon: '✨'
  }
};

export const STATUS_CONFIG: Record<EventStatus, { label: string; className: string }> = {
  upcoming: { label: 'Upcoming', className: 'bg-muted text-muted-foreground' },
  open_registration: { label: 'Open for Registration', className: 'bg-green-500/20 text-green-400 border border-green-500/50' },
  sold_out: { label: 'Sold Out', className: 'bg-red-500/20 text-red-400 border border-red-500/50' },
  live: { label: 'Broadcast Live', className: 'bg-secondary/20 text-secondary border border-secondary/50 animate-pulse' },
  completed: { label: 'Completed', className: 'bg-muted/50 text-muted-foreground' }
};
