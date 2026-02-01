import { Flame } from "lucide-react";

const games = [
  { name: "ONE PIECE", color: "from-red-500 to-orange-500" },
  { name: "Pokémon", color: "from-yellow-400 to-yellow-600" },
  { name: "Magic", color: "from-orange-500 to-red-600" },
  { name: "Dragon Ball", color: "from-blue-400 to-cyan-500" },
];

export function SupportedGames() {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="gradient-blob gradient-blob-purple w-[600px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Game icons row */}
        <div className="flex flex-wrap justify-center items-end gap-8 md:gap-16 mb-8">
          {games.map((game) => (
            <div key={game.name} className="flex flex-col items-center gap-3 group">
              {/* Mascot placeholder */}
              <div className="w-20 h-24 md:w-28 md:h-32 rounded-2xl bg-gradient-to-br from-muted to-card border border-border/30 flex items-center justify-center transition-transform group-hover:scale-105 group-hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${game.color} opacity-60`} />
              </div>
              {/* Game name */}
              <span className="text-sm md:text-base font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                {game.name}
              </span>
            </div>
          ))}
        </div>

        {/* Section title */}
        <h2 className="text-center text-2xl md:text-3xl font-bold text-foreground mb-12">
          Supported Games
        </h2>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <FeatureCard
            icon="scan"
            title="Scan"
            description="Use a card in your and digital cards, keeps an old exclusive your bucks."
          />
          <FeatureCard
            icon="match"
            title="Price Match"
            description="Discover interesting your collection man to see avel uted i supports liner history."
            highlighted
          />
          <FeatureCard
            icon="save"
            title="Save to Collection"
            description="Discore baspitte prints of coosity, and drop oxeltral vosinamtire awvipor times."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  highlighted = false 
}: { 
  icon: string; 
  title: string; 
  description: string; 
  highlighted?: boolean;
}) {
  return (
    <div className={`glass-card p-5 rounded-2xl transition-all hover:-translate-y-1 ${highlighted ? 'neon-border-pink' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            icon === 'scan' ? 'bg-orange-500/20 text-orange-400' :
            icon === 'match' ? 'bg-pink-500/20 text-pink-400' :
            'bg-cyan-500/20 text-cyan-400'
          }`}>
            {icon === 'scan' && <span className="text-lg">📡</span>}
            {icon === 'match' && <Flame className="w-5 h-5" />}
            {icon === 'save' && <span className="text-lg">🔖</span>}
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <span className="text-muted-foreground">›</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}