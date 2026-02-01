import { useEffect, useState } from "react";
import { TrendingUp, Clock } from "lucide-react";

interface HolyGrailItem {
  id: string;
  name: string;
  game: string;
  set: string;
  image_url: string;
  rarity: string;
  timestamp: string;
}

// Featured community posts - not pricing data
const FEATURED_CARDS: HolyGrailItem[] = [
  {
    id: "1",
    name: "Charizard ex",
    game: "pokemon",
    set: "Obsidian Flames",
    image_url: "https://images.pokemontcg.io/sv3/234.png",
    rarity: "secret",
    timestamp: "Just scanned",
  },
  {
    id: "2",
    name: "Monkey D. Luffy",
    game: "onepiece",
    set: "Romance Dawn",
    image_url: "https://limitlesstcg.nyc3.digitaloceanspaces.com/one-piece/OP01/OP01-003_ALT.webp",
    rarity: "ultra",
    timestamp: "2h ago",
  },
  {
    id: "3",
    name: "Black Lotus",
    game: "magic",
    set: "Alpha",
    image_url: "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7c10.jpg",
    rarity: "secret",
    timestamp: "Added to collection",
  },
  {
    id: "4",
    name: "Blue-Eyes White Dragon",
    game: "yugioh",
    set: "Legend of Blue Eyes",
    image_url: "https://images.ygoprodeck.com/images/cards/89631139.jpg",
    rarity: "rare",
    timestamp: "Listed on marketplace",
  },
  {
    id: "5",
    name: "Shanks",
    game: "onepiece",
    set: "Romance Dawn",
    image_url: "https://limitlesstcg.nyc3.digitaloceanspaces.com/one-piece/OP01/OP01-120_SR.webp",
    rarity: "ultra",
    timestamp: "5h ago",
  },
  {
    id: "6",
    name: "Pikachu VMAX",
    game: "pokemon",
    set: "Vivid Voltage",
    image_url: "https://images.pokemontcg.io/swsh4/188.png",
    rarity: "rare",
    timestamp: "Just scanned",
  },
];

function getGameLabel(game: string): string {
  const labels: Record<string, string> = {
    pokemon: "Pokémon",
    magic: "Magic",
    yugioh: "Yu-Gi-Oh!",
    onepiece: "One Piece",
    lorcana: "Lorcana",
  };
  return labels[game] || game;
}

function getRarityClass(rarity: string): string {
  const classes: Record<string, string> = {
    rare: "rarity-tag-rare",
    ultra: "rarity-tag-ultra",
    secret: "rarity-tag-secret",
  };
  return classes[rarity] || "rarity-tag";
}

export function MarketTicker() {
  const [items] = useState<HolyGrailItem[]>(FEATURED_CARDS);
  const [lastUpdated] = useState(new Date());

  if (items.length === 0) return null;

  // Duplicate for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <div className="w-full overflow-hidden py-6 border-b border-border/30">
      <div className="flex items-center gap-3 mb-4 px-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Holy Grails</h2>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Marquee */}
        <div className="flex animate-marquee hover:pause-animation">
          {duplicatedItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex-shrink-0 w-56 mx-2"
            >
              <div className="glass-card p-3 h-full hover:neon-glow-cyan transition-all duration-300 cursor-pointer group">
                <div className="flex gap-3">
                  {/* Card Image */}
                  <div className="w-14 h-20 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0 group-hover:scale-105 transition-transform">
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
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-xs text-muted-foreground">
                      {getGameLabel(item.game)}
                    </span>
                    <h3 className="text-sm font-medium line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.set}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className={getRarityClass(item.rarity)}>
                        {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  {item.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
