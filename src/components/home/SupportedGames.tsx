import { Flame, Bookmark, Radar, ChevronRight } from "lucide-react";

const games = [
  { 
    name: "ONE PIECE", 
    color: "from-red-500 to-orange-500",
    logoColor: "text-cyan-400",
    character: "🏴‍☠️"
  },
  { 
    name: "Pokémon", 
    color: "from-yellow-400 to-yellow-600",
    logoColor: "text-yellow-400",
    character: "⚡"
  },
  { 
    name: "Magic", 
    color: "from-orange-500 to-red-600",
    logoColor: "text-orange-400",
    character: "🔥"
  },
  { 
    name: "Dragon Ball", 
    color: "from-blue-400 to-cyan-500",
    logoColor: "text-orange-500",
    character: "💫"
  },
];

export function SupportedGames() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="gradient-blob gradient-blob-purple w-[800px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute opacity-25" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Game mascots row */}
        <div className="flex flex-wrap justify-center items-end gap-8 md:gap-16 lg:gap-24 mb-12">
          {games.map((game, index) => (
            <div key={game.name} className="flex flex-col items-center gap-4 group">
              {/* Mascot placeholder with glow */}
              <div 
                className="relative w-24 h-28 md:w-32 md:h-36 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2"
              >
                {/* Character glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-30 blur-2xl rounded-full scale-75`} />
                {/* Character placeholder */}
                <div className="relative z-10 text-6xl md:text-7xl">
                  {game.character}
                </div>
              </div>
              {/* Game logo/name */}
              <div className="flex items-center gap-2">
                {game.name === "ONE PIECE" && (
                  <div className="w-5 h-5 rounded bg-cyan-500/30 flex items-center justify-center">
                    <span className="text-xs">🌊</span>
                  </div>
                )}
                {game.name === "Pokémon" && (
                  <div className="w-5 h-5 rounded-full bg-red-500/80 border-2 border-white/30" />
                )}
                {game.name === "Magic" && (
                  <Flame className="w-5 h-5 text-orange-400" />
                )}
                {game.name === "Dragon Ball" && (
                  <span className="text-lg">🐉</span>
                )}
                <span className={`text-base md:text-lg font-bold ${game.logoColor} tracking-wide`}>
                  {game.name === "ONE PIECE" ? "ONE PIECE" : 
                   game.name === "Pokémon" ? "POKÉMON" :
                   game.name === "Magic" ? "MAGIC" :
                   "DRAGON BALL"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Section title */}
        <h2 className="text-center text-2xl md:text-3xl font-bold text-foreground mb-10">
          Supported Games
        </h2>

        {/* Feature cards - 3 columns */}
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
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
    <div className={`glass-card p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${highlighted ? 'neon-border-pink' : 'hover:border-primary/30'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            icon === 'scan' ? 'bg-orange-500/20' :
            icon === 'match' ? 'bg-pink-500/20' :
            'bg-cyan-500/20'
          }`}>
            {icon === 'scan' && <Radar className="w-5 h-5 text-orange-400" />}
            {icon === 'match' && <Flame className="w-5 h-5 text-pink-400" />}
            {icon === 'save' && <Bookmark className="w-5 h-5 text-cyan-400" />}
          </div>
          <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
