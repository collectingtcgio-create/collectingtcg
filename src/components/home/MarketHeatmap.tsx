import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TCGHeatData {
  game: string;
  label: string;
  change: number;
  volume: number;
  emoji: string;
  color: string;
}

// Simulated market data - in production this would come from an API
const MARKET_DATA: TCGHeatData[] = [
  { game: "pokemon", label: "Pokémon", change: 4.2, volume: 8500, emoji: "⚡", color: "bg-primary" },
  { game: "onepiece", label: "One Piece", change: 12.8, volume: 6200, emoji: "🏴‍☠️", color: "bg-secondary" },
  { game: "magic", label: "Magic", change: -1.3, volume: 7100, emoji: "🧙", color: "bg-accent" },
  { game: "lorcana", label: "Lorcana", change: 8.5, volume: 3800, emoji: "✨", color: "bg-primary" },
  { game: "yugioh", label: "Yu-Gi-Oh!", change: 2.1, volume: 5400, emoji: "🎴", color: "bg-secondary" },
  { game: "dragonball", label: "Dragon Ball", change: 6.7, volume: 2100, emoji: "🐉", color: "bg-accent" },
];

export function MarketHeatmap() {
  const [data, setData] = useState<TCGHeatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [topGainer, setTopGainer] = useState<TCGHeatData | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      const sortedData = [...MARKET_DATA].sort((a, b) => b.change - a.change);
      setData(sortedData);
      setTopGainer(sortedData[0]);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const getHeatIntensity = (change: number): string => {
    const absChange = Math.abs(change);
    if (absChange >= 10) return "opacity-100";
    if (absChange >= 5) return "opacity-80";
    if (absChange >= 2) return "opacity-60";
    return "opacity-40";
  };

  return (
    <div className="glass-card p-4 neon-border-magenta h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4 text-secondary" />
          Market Heatmap
        </h2>
        <span className="text-[10px] text-muted-foreground">24h Change</span>
      </div>

      {/* Top Gainer Highlight */}
      {loading ? (
        <Skeleton className="h-12 w-full mb-3" />
      ) : topGainer && (
        <div className="p-2 rounded-lg bg-gradient-to-r from-secondary/20 to-primary/20 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{topGainer.emoji}</span>
              <div>
                <p className="text-xs font-medium">{topGainer.label}</p>
                <p className="text-[10px] text-muted-foreground">Top Gainer</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{topGainer.change.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {loading
          ? [...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))
          : data.map((item) => (
              <div
                key={item.game}
                className={`relative p-2 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
                  item.change >= 0 ? "bg-green-500/20" : "bg-red-500/20"
                } ${getHeatIntensity(item.change)}`}
              >
                <div className="text-center">
                  <span className="text-sm">{item.emoji}</span>
                  <p className="text-[9px] font-medium truncate mt-0.5">{item.label}</p>
                  <p
                    className={`text-[10px] font-bold ${
                      item.change >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {item.change >= 0 ? "+" : ""}
                    {item.change.toFixed(1)}%
                  </p>
                </div>
                {/* Heat bar */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg ${item.color} ${getHeatIntensity(item.change)}`}
                />
              </div>
            ))}
      </div>

      {/* Volume indicator */}
      <div className="mt-3 pt-2 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground text-center">
          Based on market activity & price movements
        </p>
      </div>
    </div>
  );
}
