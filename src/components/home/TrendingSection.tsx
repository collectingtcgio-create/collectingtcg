import { TrendingUp, Trophy, DollarSign } from "lucide-react";

export function TrendingSection() {
  return (
    <section className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Trending Pulls */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Trending Pulls
              </h3>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                86.7k
              </span>
            </div>
            <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 overflow-hidden">
              <div className="absolute inset-4 rounded-lg bg-muted/40 border border-border/30" />
              <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                86.7k
              </div>
            </div>
          </div>

          {/* Top Collections */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Top Collections
              </h3>
            </div>
            <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 overflow-hidden flex items-center justify-center gap-2 p-4">
              <div className="w-16 h-20 rounded-lg bg-muted/50 border border-border/30 -rotate-6" />
              <div className="w-16 h-20 rounded-lg bg-muted/50 border border-yellow-500/30 scale-110 z-10" />
              <div className="w-16 h-20 rounded-lg bg-muted/50 border border-border/30 rotate-6" />
              <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-yellow-500/80 text-yellow-950 text-xs font-medium">
                75.5k
              </div>
            </div>
          </div>

          {/* Live Marketplace Deals */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Live Marketplace Deals
              </h3>
            </div>
            <div className="space-y-3">
              <DealItem 
                seller="Piece Cards" 
                description="Rarer noton cards" 
                price="$175" 
                bonus="+1400" 
              />
              <DealItem 
                seller="Piece Cards" 
                description="Reon noton cards" 
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
  price, 
  bonus 
}: { 
  seller: string; 
  description: string; 
  price: string; 
  bonus: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <span className="text-xs">📦</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{seller}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">{price}</p>
        <p className="text-xs text-primary">{bonus} ⭐</p>
      </div>
    </div>
  );
}