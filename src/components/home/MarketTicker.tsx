import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HolyGrailItem {
  id: string;
  name: string;
  type: "card" | "sealed";
  game: string;
  image_url: string;
  price: number | null;
  priceChange?: number;
}

// Static list of "Holy Grail" items with fallback images
const HOLY_GRAIL_ITEMS: Omit<HolyGrailItem, "price" | "priceChange">[] = [
  // Pokemon
  {
    id: "psa10-charizard-1st",
    name: "Charizard (Base Set 4/102)",
    type: "card",
    game: "pokemon",
    image_url: "https://images.pokemontcg.io/base1/4_hires.png",
  },
  // One Piece
  {
    id: "luffy-op01-alt",
    name: "Monkey D. Luffy (OP01-003 Alt Art)",
    type: "card",
    game: "onepiece",
    image_url: "https://limitlesstcg.nyc3.digitaloceanspaces.com/one-piece/OP01/OP01-003_ALT.webp",
  },
  // Magic
  {
    id: "black-lotus",
    name: "Black Lotus (Alpha)",
    type: "card",
    game: "magic",
    image_url: "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7c10.jpg",
  },
  // One Piece
  {
    id: "shanks-op01",
    name: "Shanks (OP01-120 SEC)",
    type: "card",
    game: "onepiece",
    image_url: "https://limitlesstcg.nyc3.digitaloceanspaces.com/one-piece/OP01/OP01-120_SR.webp",
  },
  // Yu-Gi-Oh
  {
    id: "blue-eyes-lob",
    name: "Blue-Eyes White Dragon (LOB-001)",
    type: "card",
    game: "yugioh",
    image_url: "https://images.ygoprodeck.com/images/cards/89631139.jpg",
  },
  // Pokemon
  {
    id: "pikachu-illustrator",
    name: "Pikachu (Promo)",
    type: "card",
    game: "pokemon",
    image_url: "https://images.pokemontcg.io/basep/4_hires.png",
  },
  // One Piece
  {
    id: "nami-op01",
    name: "Nami (OP01-016 SR)",
    type: "card",
    game: "onepiece",
    image_url: "https://limitlesstcg.nyc3.digitaloceanspaces.com/one-piece/OP01/OP01-016_SR.webp",
  },
  // Magic
  {
    id: "mox-sapphire",
    name: "Mox Sapphire (Beta)",
    type: "card",
    game: "magic",
    image_url: "https://cards.scryfall.io/large/front/e/a/ea1feac0-d3a7-45eb-9719-1cdaf51ea0b6.jpg",
  },
  // Yu-Gi-Oh
  {
    id: "dark-magician-lob",
    name: "Dark Magician (LOB-005)",
    type: "card",
    game: "yugioh",
    image_url: "https://images.ygoprodeck.com/images/cards/46986414.jpg",
  },
  // Lorcana
  {
    id: "elsa-enchanted",
    name: "Elsa - Spirit of Winter (Enchanted)",
    type: "card",
    game: "lorcana",
    image_url: "https://lorcana-api.com/images/elsa/spirit_of_winter/elsa-spirit_of_winter-large.png",
  },
  // Pokemon Sealed
  {
    id: "base-set-booster-box",
    name: "Base Set Booster Box (Sealed)",
    type: "sealed",
    game: "pokemon",
    image_url: "https://images.pokemontcg.io/base1/4_hires.png",
  },
  // Lorcana
  {
    id: "mickey-mouse-enchanted",
    name: "Mickey Mouse - Wayward Sorcerer (Enchanted)",
    type: "card",
    game: "lorcana",
    image_url: "https://product-images.tcgplayer.com/fit-in/437x437/527867.jpg",
  },
  // Magic
  {
    id: "ancestral-recall",
    name: "Ancestral Recall (Alpha)",
    type: "card",
    game: "magic",
    image_url: "https://cards.scryfall.io/large/front/2/3/2398892d-28e9-4009-81ec-0d544af79d2b.jpg",
  },
];

// Fallback prices for when API fails
const FALLBACK_PRICES: Record<string, number> = {
  "psa10-charizard-1st": 420000,
  "pikachu-illustrator": 5275000,
  "base-set-booster-box": 45000,
  "black-lotus": 540000,
  "mox-sapphire": 35000,
  "ancestral-recall": 48000,
  "blue-eyes-lob": 12500,
  "dark-magician-lob": 8500,
  "luffy-op01-alt": 1250,
  "shanks-op01": 680,
  "nami-op01": 95,
  "elsa-enchanted": 285,
  "mickey-mouse-enchanted": 195,
};

// Cache key for localStorage
const CACHE_KEY = "holy_grails_prices";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week in ms

interface CachedPrices {
  timestamp: number;
  prices: Record<string, { price: number | null; priceChange?: number; image_url?: string }>;
}

function getCachedPrices(): CachedPrices | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedPrices = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid (1 week)
    if (now - parsed.timestamp < CACHE_DURATION) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedPrices(prices: CachedPrices["prices"]) {
  try {
    const cache: CachedPrices = {
      timestamp: Date.now(),
      prices,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
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
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = getCachedPrices();
      if (cached) {
        const cachedItems = HOLY_GRAIL_ITEMS.map((item) => ({
          ...item,
          price: cached.prices[item.id]?.price ?? FALLBACK_PRICES[item.id] ?? null,
          priceChange: cached.prices[item.id]?.priceChange,
        }));
        setItems(cachedItems);
        setLastUpdated(new Date(cached.timestamp));
        return;
      }
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-market-prices");
      
      if (error) throw error;
      
      if (data?.success && data?.prices) {
        const priceMap: Record<string, { price: number | null; priceChange?: number; image_url?: string }> = {};
        
        for (const priceData of data.prices) {
          priceMap[priceData.id] = {
            price: priceData.price,
            priceChange: priceData.priceChange,
            image_url: priceData.image_url,
          };
        }
        
        // Cache the prices
        setCachedPrices(priceMap);
        
        const updatedItems = HOLY_GRAIL_ITEMS.map((item) => ({
          ...item,
          price: priceMap[item.id]?.price ?? FALLBACK_PRICES[item.id] ?? null,
          priceChange: priceMap[item.id]?.priceChange,
          // Use API image if available, otherwise keep the static one
          image_url: priceMap[item.id]?.image_url || item.image_url,
        }));
        
        setItems(updatedItems);
        setLastUpdated(new Date());
      } else {
        // Fallback to static prices
        const fallbackItems = HOLY_GRAIL_ITEMS.map((item) => ({
          ...item,
          price: FALLBACK_PRICES[item.id] || null,
          priceChange: undefined,
        }));
        setItems(fallbackItems);
      }
    } catch (error) {
      console.error("Failed to fetch market prices:", error);
      // Use fallback prices
      const fallbackItems = HOLY_GRAIL_ITEMS.map((item) => ({
        ...item,
        price: FALLBACK_PRICES[item.id] || null,
        priceChange: undefined,
      }));
      setItems(fallbackItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  if (items.length === 0) return null;

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <div className="w-full overflow-hidden mb-8">
      <div className="flex items-center gap-2 mb-3 px-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Holy Grails Market</h2>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {loading ? "Updating..." : lastUpdated ? `Updated ${lastUpdated.toLocaleDateString()}` : "Weekly"}
        </span>
        <button
          onClick={() => fetchPrices(true)}
          disabled={loading}
          className="ml-auto p-1.5 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
          title="Refresh prices"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
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
