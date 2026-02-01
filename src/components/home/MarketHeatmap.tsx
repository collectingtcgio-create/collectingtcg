import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TCGHeatData {
  game: string;
  label: string;
  change: number;
  posts: number;
  emoji: string;
}

// Engagement data - community activity, not prices
const ENGAGEMENT_DATA: TCGHeatData[] = [
  { game: "onepiece", label: "One Piece", change: 18.5, posts: 2840, emoji: "🏴‍☠️" },
  { game: "pokemon", label: "Pokémon", change: 8.2, posts: 5620, emoji: "⚡" },
  { game: "magic", label: "Magic", change: 3.1, posts: 3180, emoji: "🧙" },
  { game: "yugioh", label: "Yu-Gi-Oh!", change: -2.4, posts: 1950, emoji: "🎴" },
  { game: "dragonball", label: "Dragon Ball", change: 12.7, posts: 890, emoji: "🐉" },
];

export function MarketHeatmap() {
  const [data, setData] = useState<TCGHeatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const sortedData = [...ENGAGEMENT_DATA].sort((a, b) => b.change - a.change);
      setData(sortedData);
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const getHeatColor = (change: number): string => {
    if (change >= 15) return "from-secondary/30 to-secondary/10 border-secondary/40";
    if (change >= 8) return "from-primary/30 to-primary/10 border-primary/40";
    if (change >= 0) return "from-accent/20 to-accent/5 border-accent/30";
    return "from-destructive/20 to-destructive/5 border-destructive/30";
  };

  const getChangeColor = (change: number): string => {
    if (change >= 0) return "text-emerald-400";
    return "text-red-400";
  };

  return (
    <div className="glass-card p-5 h-full neon-border-pink">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-secondary" />
          Trending Communities
        </h2>
        <span className="text-xs text-muted-foreground">24h activity</span>
      </div>

      <div className="space-y-2">
        {loading
          ? [...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))
          : data.map((item, index) => (
              <div
                key={item.game}
                className={`relative p-3 rounded-xl border bg-gradient-to-r transition-all duration-300 hover:scale-[1.02] cursor-pointer ${getHeatColor(item.change)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.emoji}</span>
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.posts.toLocaleString()} posts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold flex items-center gap-1 ${getChangeColor(item.change)}`}>
                      {item.change >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {item.change >= 0 ? "+" : ""}
                      {item.change.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Rank indicator */}
                {index === 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
