// Gift mascot configuration with non-copyright TCG mascots
export type GiftType = 
  | 'spark_hamster'
  | 'pirate_panda'
  | 'wizard_owl'
  | 'magma_mole'
  | 'ghost_cat'
  | 'mecha_pup';

export interface GiftMascot {
  id: GiftType;
  name: string;
  element: string;
  emoji: string;
  creditCost: number;
  color: string;
  glowColor: string;
  tier: 'bronze' | 'silver' | 'gold';
}

export const GIFT_MASCOTS: GiftMascot[] = [
  {
    id: 'spark_hamster',
    name: 'Spark-Hamster',
    element: 'Lightning',
    emoji: '⚡🐹',
    creditCost: 10,
    color: 'hsl(45, 100%, 50%)',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    tier: 'bronze',
  },
  {
    id: 'pirate_panda',
    name: 'Pirate-Panda',
    element: 'Water',
    emoji: '🏴‍☠️🐼',
    creditCost: 25,
    color: 'hsl(200, 100%, 50%)',
    glowColor: 'rgba(0, 191, 255, 0.5)',
    tier: 'bronze',
  },
  {
    id: 'wizard_owl',
    name: 'Wizard-Owl',
    element: 'Magic',
    emoji: '🧙🦉',
    creditCost: 50,
    color: 'hsl(270, 100%, 60%)',
    glowColor: 'rgba(138, 43, 226, 0.5)',
    tier: 'silver',
  },
  {
    id: 'magma_mole',
    name: 'Magma-Mole',
    element: 'Fire',
    emoji: '🔥🐀',
    creditCost: 100,
    color: 'hsl(15, 100%, 50%)',
    glowColor: 'rgba(255, 69, 0, 0.5)',
    tier: 'silver',
  },
  {
    id: 'ghost_cat',
    name: 'Ghost-Cat',
    element: 'Spirit',
    emoji: '👻🐱',
    creditCost: 250,
    color: 'hsl(280, 80%, 70%)',
    glowColor: 'rgba(186, 85, 211, 0.5)',
    tier: 'gold',
  },
  {
    id: 'mecha_pup',
    name: 'Mecha-Pup',
    element: 'Tech',
    emoji: '🤖🐕',
    creditCost: 500,
    color: 'hsl(186, 100%, 50%)',
    glowColor: 'rgba(0, 255, 255, 0.5)',
    tier: 'gold',
  },
];

export const getGiftByType = (type: GiftType): GiftMascot | undefined => {
  return GIFT_MASCOTS.find(g => g.id === type);
};

export const getTierColor = (tier: 'bronze' | 'silver' | 'gold'): string => {
  switch (tier) {
    case 'bronze': return 'hsl(30, 60%, 50%)';
    case 'silver': return 'hsl(0, 0%, 75%)';
    case 'gold': return 'hsl(45, 100%, 50%)';
  }
};

// Calculate 50/50 split
export const calculateGiftSplit = (creditCost: number) => {
  const dollarValue = creditCost / 100; // 100 credits = $1
  return {
    recipientEarned: dollarValue * 0.5,
    platformRevenue: dollarValue * 0.5,
  };
};
