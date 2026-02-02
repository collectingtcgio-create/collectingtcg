import { TrendingUp, Trophy, DollarSign } from "lucide-react";

export function TrendingSection() {
  return (
    <section className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Trending Pulls */}
          <div className="glass-card p-5 rounded-2xl group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-lg">
                Trending Pulls
              </h3>
              <span className="text-xs px-3 py-1 rounded-full bg-muted/60 text-muted-foreground font-medium border border-border/50">
                86.7k
              </span>
            </div>
            <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 overflow-hidden">
              {/* Card stack visual */}
              <div className="absolute inset-3 rounded-lg bg-gradient-to-br from-orange-500/30 to-red-500/30 border border-border/30 transform -rotate-3" />
              <div className="absolute inset-3 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-border/30 transform rotate-2 translate-x-1" />
              <div className="absolute inset-4 rounded-lg bg-muted/40 border border-border/30" />
              {/* View count badge */}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-primary/90 text-primary-foreground text-sm font-semibold">
                86.7k
              </div>
            </div>
          </div>

          {/* Top Collections */}
          <div className="glass-card p-5 rounded-2xl group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-lg">
                Top Collections
              </h3>
            </div>
            <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 overflow-hidden flex items-center justify-center p-4">
              {/* Trophy and cards visual */}
              <div className="relative flex items-end gap-1">
                {/* Left card */}
                <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-border/30 -rotate-12 transform translate-y-2" />
                {/* Center trophy/card */}
                <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-yellow-500/40 to-orange-500/40 border-2 border-yellow-500/50 z-10 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
                {/* Right card */}
                <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-pink-500/30 to-red-500/30 border border-border/30 rotate-12 transform translate-y-2" />
              </div>
              {/* View count badge */}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-cyan-500/90 text-cyan-950 text-sm font-semibold">
                75.5k
              </div>
            </div>
          </div>

          {/* Live Marketplace Deals */}
          <div className="glass-card p-5 rounded-2xl group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-lg">
                Live Marketplace Deals
              </h3>
            </div>
            <div className="space-y-3">
              <DealItem 
                seller="Piece Cards" 
                description="Rarer noton cards" 
                subtitle="Also on captain pg."
                price="$175" 
                bonus="+1400" 
              />
              <DealItem 
                seller="Piece Cards" 
                description="Reon noton cards" 
                subtitle="Star on cards pt."
                price="$175" 
                bonus="+860" 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DealItem({ 
  seller, 
  description, 
  subtitle,
  price, 
  bonus 
}: { 
  seller: string; 
  description: string; 
  subtitle: string;
  price: string; 
  bonus: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/30 transition-colors cursor-pointer">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/30">
        <span className="text-sm">📦</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/50" />
          <p className="text-sm font-medium text-foreground truncate">{seller}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
        <p className="text-xs text-muted-foreground/60 truncate">{subtitle}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-foreground">{price} <span className="text-muted-foreground text-xs">ea</span></p>
        <p className="text-xs text-primary font-medium">{bonus} ⭐</p>
      </div>
    </div>
  );
}
