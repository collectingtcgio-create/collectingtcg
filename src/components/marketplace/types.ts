export type ListingStatus = 'active' | 'sold' | 'cancelled';
export type CardCondition = 'near_mint' | 'lightly_played' | 'moderately_played' | 'heavily_played' | 'damaged';
export type ListingType = 'single' | 'lot' | 'sealed' | 'bundle';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'holo_rare' | 'ultra_rare' | 'secret_rare' | 'special_art' | 'full_art' | 'promo' | 'other';

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  card_id: string | null;
  card_name: string;
  image_url: string | null;
  images: string[];
  tcg_game: string;
  asking_price: number;
  condition: CardCondition;
  listing_type: ListingType;
  rarity: CardRarity | null;
  rarity_custom: string | null;
  quantity: number;
  description: string | null;
  status: ListingStatus;
  accepts_offers: boolean;
  created_at: string;
  updated_at: string;
  sold_at: string | null;
  sold_price: number | null;
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

export const listingTypeLabels: Record<ListingType, string> = {
  single: 'Single Card',
  lot: 'Card Lot',
  sealed: 'Sealed Product',
  bundle: 'Mixed Bundle',
};

export const listingTypeColors: Record<ListingType, string> = {
  single: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  lot: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  sealed: 'bg-green-500/20 text-green-400 border-green-500/50',
  bundle: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
};

export const rarityLabels: Record<CardRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  holo_rare: 'Holo Rare',
  ultra_rare: 'Ultra Rare',
  secret_rare: 'Secret Rare',
  special_art: 'Special Art',
  full_art: 'Full Art',
  promo: 'Promo',
  other: 'Other',
};

export const rarityColors: Record<CardRarity, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  holo_rare: 'text-cyan-400',
  ultra_rare: 'text-purple-400',
  secret_rare: 'text-yellow-400',
  special_art: 'text-pink-400',
  full_art: 'text-orange-400',
  promo: 'text-red-400',
  other: 'text-muted-foreground',
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
  starwars: 'bg-blue-600/20 text-blue-300 border-blue-600/50',
};

export const gameLabels: Record<string, string> = {
  pokemon: 'Pokémon',
  magic: 'Magic: The Gathering',
  yugioh: 'Yu-Gi-Oh!',
  onepiece: 'One Piece',
  lorcana: 'Lorcana',
  dragonball: 'Dragon Ball',
  unionarena: 'Union Arena',
  marvel: 'Marvel',
  starwars: 'Star Wars',
};
