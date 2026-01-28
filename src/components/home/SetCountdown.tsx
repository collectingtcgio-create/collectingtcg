import { useState, useEffect } from "react";
import { Clock, Sparkles, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UpcomingSet {
  id: string;
  name: string;
  game: string;
  releaseDate: Date;
  emoji: string;
  imageUrl?: string;
}

// Upcoming TCG sets - in production this would come from an API
const UPCOMING_SETS: UpcomingSet[] = [
  {
    id: "sv9",
    name: "Surging Sparks",
    game: "Pokémon",
    releaseDate: new Date("2026-02-21"),
    emoji: "⚡",
  },
  {
    id: "op10",
    name: "Royal Blood",
    game: "One Piece",
    releaseDate: new Date("2026-02-28"),
    emoji: "🏴‍☠️",
  },
  {
    id: "lor5",
    name: "Shimmering Skies",
    game: "Lorcana",
    releaseDate: new Date("2026-03-07"),
    emoji: "✨",
  },
  {
    id: "mtg-thb",
    name: "Thunder Junction",
    game: "Magic",
    releaseDate: new Date("2026-04-19"),
    emoji: "🧙",
  },
];

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export function SetCountdown() {
  const [nextSet, setNextSet] = useState<UpcomingSet | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingSets, setUpcomingSets] = useState<UpcomingSet[]>([]);

  useEffect(() => {
    // Find the next upcoming set
    const now = new Date();
    const upcoming = UPCOMING_SETS
      .filter((set) => set.releaseDate > now)
      .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());

    if (upcoming.length > 0) {
      setNextSet(upcoming[0]);
      setUpcomingSets(upcoming.slice(1, 3));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!nextSet) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(nextSet.releaseDate));
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft(nextSet.releaseDate));

    return () => clearInterval(timer);
  }, [nextSet]);

  return (
    <div className="glass-card p-4 neon-border-cyan h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Set Countdown
        </h2>
        <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : nextSet && timeLeft ? (
        <>
          {/* Main Countdown */}
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-xl">{nextSet.emoji}</span>
              <div>
                <p className="text-sm font-bold">{nextSet.name}</p>
                <p className="text-[10px] text-muted-foreground">{nextSet.game}</p>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-1">
              <div className="bg-muted/50 rounded-lg px-2 py-1.5 min-w-[40px]">
                <p className="text-lg font-bold text-primary">{timeLeft.days}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Days</p>
              </div>
              <span className="text-muted-foreground">:</span>
              <div className="bg-muted/50 rounded-lg px-2 py-1.5 min-w-[40px]">
                <p className="text-lg font-bold text-primary">{timeLeft.hours.toString().padStart(2, "0")}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Hrs</p>
              </div>
              <span className="text-muted-foreground">:</span>
              <div className="bg-muted/50 rounded-lg px-2 py-1.5 min-w-[40px]">
                <p className="text-lg font-bold text-primary">{timeLeft.minutes.toString().padStart(2, "0")}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Min</p>
              </div>
              <span className="text-muted-foreground">:</span>
              <div className="bg-muted/50 rounded-lg px-2 py-1.5 min-w-[40px]">
                <p className="text-lg font-bold text-secondary animate-pulse">{timeLeft.seconds.toString().padStart(2, "0")}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Sec</p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground mt-2">
              <Calendar className="w-3 h-3 inline mr-1" />
              {nextSet.releaseDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Upcoming Sets */}
          {upcomingSets.length > 0 && (
            <div className="border-t border-border/50 pt-2 mt-2">
              <p className="text-[10px] text-muted-foreground mb-2">Coming Soon</p>
              <div className="space-y-1">
                {upcomingSets.map((set) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{set.emoji}</span>
                      <span className="font-medium truncate max-w-[100px]">{set.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {set.releaseDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">
          No upcoming sets scheduled
        </p>
      )}
    </div>
  );
}
