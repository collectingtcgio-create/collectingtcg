export type ListingStatus = 'active' | 'sold' | 'cancelled';
export type CardCondition = 'near_mint' | 'lightly_played' | 'moderately_played' | 'heavily_played' | 'damaged';

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  card_id: string | null;
  card_name: string;
  image_url: string | null;
  tcg_game: string;
  asking_price: number;
  condition: CardCondition;
  description: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export const conditionLabels: Record<CardCondition, string> = {
  near_mint: 'Near Mint',
  lightly_played: 'Lightly Played',
  moderately_played: 'Moderately Played',
  heavily_played: 'Heavily Played',
  damaged: 'Damaged',
};

export const conditionColors: Record<CardCondition, string> = {
  near_mint: 'text-green-400',
  lightly_played: 'text-cyan-400',
  moderately_played: 'text-yellow-400',
  heavily_played: 'text-orange-400',
  damaged: 'text-red-400',
};

export const gameColors: Record<string, string> = {
  pokemon: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  magic: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  yugioh: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  onepiece: 'bg-red-500/20 text-red-400 border-red-500/50',
  lorcana: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  dragonball: 'bg-orange-600/20 text-orange-300 border-orange-600/50',
  unionarena: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
  marvel: 'bg-red-600/20 text-red-300 border-red-600/50',
};
