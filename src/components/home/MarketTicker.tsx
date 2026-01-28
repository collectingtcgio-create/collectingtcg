import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

interface HolyGrailItem {
  id: string;
  name: string;
  type: "card" | "sealed";
  game: string;
  image_url: string;
  price: number | null;
  priceChange?: number; // percentage
}

// Static list of "Holy Grail" items - these are the most sought-after TCG collectibles
const HOLY_GRAIL_ITEMS: Omit<HolyGrailItem, "price" | "priceChange">[] = [
  // Pokemon
  {
    id: "psa10-charizard-1st",
    name: "Charizard 1st Edition (PSA 10)",
    type: "card",
    game: "pokemon",
    image_url: "https://images.pokemontcg.io/base1/4_hires.png",
  },
  {
    id: "pikachu-illustrator",
    name: "Pikachu Illustrator",
    type: "card",
    game: "pokemon",
    image_url: "https://images.pokemontcg.io/basep/4_hires.png",
  },
  {
    id: "base-set-booster-box",
    name: "Base Set Booster Box (Sealed)",
    type: "sealed",
    game: "pokemon",
    image_url: "https://product-images.tcgplayer.com/fit-in/437x437/88579.jpg",
  },
  // Magic: The Gathering
  {
    id: "black-lotus",
    name: "Black Lotus (Alpha)",
    type: "card",
    game: "magic",
    image_url: "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7c10.jpg",
  },
  {
    id: "mox-sapphire",
    name: "Mox Sapphire (Beta)",
    type: "card",
    game: "magic",
    image_url: "https://cards.scryfall.io/large/front/e/a/ea1feac0-d3a7-45eb-9719-1cdaf51ea0b6.jpg",
  },
  {
    id: "alpha-booster-box",
    name: "Alpha Booster Box (Sealed)",
    type: "sealed",
    game: "magic",
    image_url: "https://product-images.tcgplayer.com/fit-in/437x437/7831.jpg",
  },
  // Yu-Gi-Oh!
  {
    id: "blue-eyes-lob",
    name: "Blue-Eyes White Dragon (LOB-001)",
    type: "card",
    game: "yugioh",
    image_url: "https://images.ygoprodeck.com/images/cards/89631139.jpg",
  },
  {
    id: "dark-magician-lob",
    name: "Dark Magician (LOB-005)",
    type: "card",
    game: "yugioh",
    image_url: "https://images.ygoprodeck.com/images/cards/46986414.jpg",
  },
  // One Piece
  {
    id: "luffy-op01-alt",
    name: "Monkey D. Luffy (Alt Art)",
    type: "card",
    game: "onepiece",
    image_url: "https://product-images.tcgplayer.com/fit-in/437x437/507251.jpg",
  },
  {
    id: "shanks-op01",
    name: "Shanks (OP01-120 SEC)",
    type: "card",
    game: "onepiece",
    image_url: "https://product-images.tcgplayer.com/fit-in/437x437/508087.jpg",
  },
  // Lorcana
  {
    id: "elsa-enchanted",
    name: "Elsa - Spirit of Winter (Enchanted)",
    type: "card",
    game: "lorcana",
    image_url: "https://product-images.tcgplayer.com/fit-in/437x437/526044.jpg",
  },
  {
    id: "mickey-mouse-enchanted",
    name: "Mickey Mouse - Wayward Sorcerer (Enchanted)",
    type: "card",
    game: "lorcana",
    image_url: "https://product-images.tcgplayer.com/fit-in/437x437/527867.jpg",
  },
];

// Generate mock prices (in production, these would come from APIs)
function generateMockPrice(item: Omit<HolyGrailItem, "price" | "priceChange">): HolyGrailItem {
  const basePrices: Record<string, number> = {
    "psa10-charizard-1st": 420000,
    "pikachu-illustrator": 5275000,
    "base-set-booster-box": 45000,
    "black-lotus": 540000,
    "mox-sapphire": 35000,
    "alpha-booster-box": 150000,
    "blue-eyes-lob": 12500,
    "dark-magician-lob": 8500,
    "luffy-op01-alt": 850,
    "shanks-op01": 420,
    "elsa-enchanted": 285,
    "mickey-mouse-enchanted": 195,
  };

  const price = basePrices[item.id] || Math.floor(Math.random() * 10000) + 100;
  const priceChange = (Math.random() - 0.5) * 10; // -5% to +5%

  return {
    ...item,
    price,
    priceChange,
  };
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}K`;
  }
  return `$${price.toFixed(2)}`;
}

function getGameColor(game: string): string {
  const colors: Record<string, string> = {
    pokemon: "text-yellow-400",
    magic: "text-purple-400",
    yugioh: "text-orange-400",
    onepiece: "text-red-400",
    lorcana: "text-blue-400",
  };
  return colors[game] || "text-primary";
}

function getGameEmoji(game: string): string {
  const emojis: Record<string, string> = {
    pokemon: "⚡",
    magic: "🧙",
    yugioh: "🎴",
    onepiece: "🏴‍☠️",
    lorcana: "✨",
  };
  return emojis[game] || "🃏";
}

export function MarketTicker() {
  const [items, setItems] = useState<HolyGrailItem[]>([]);

  useEffect(() => {
    // Initialize with mock prices
    const grails = HOLY_GRAIL_ITEMS.map(generateMockPrice);
    setItems(grails);

    // Simulate price updates every 30 seconds
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          priceChange: (Math.random() - 0.5) * 2, // Small fluctuations
        }))
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <div className="w-full overflow-hidden mb-8">
      <div className="flex items-center gap-2 mb-3 px-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Holy Grails Market</h2>
        <span className="text-xs text-muted-foreground">(Live Prices)</span>
      </div>

      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Marquee container */}
        <div className="flex animate-marquee hover:pause-animation">
          {duplicatedItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex-shrink-0 w-64 mx-2"
            >
              <div className="glass-card p-3 rounded-xl neon-border-cyan hover:neon-glow-cyan transition-all duration-300 h-full">
                <div className="flex gap-3">
                  {/* Card Image */}
                  <div className="w-16 h-22 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm">{getGameEmoji(item.game)}</span>
                      <span className={`text-xs font-medium ${getGameColor(item.game)}`}>
                        {item.game.toUpperCase()}
                      </span>
                      {item.type === "sealed" && (
                        <span className="text-xs px-1.5 py-0.5 bg-secondary/20 text-secondary rounded">
                          SEALED
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight mb-2">
                      {item.name}
                    </h3>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {item.price ? formatPrice(item.price) : "N/A"}
                      </span>
                      {item.priceChange !== undefined && (
                        <span
                          className={`text-xs font-medium ${
                            item.priceChange >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {item.priceChange >= 0 ? "+" : ""}
                          {item.priceChange.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
