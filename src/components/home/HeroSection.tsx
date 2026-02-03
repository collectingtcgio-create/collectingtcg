import { Link } from "react-router-dom";
import { Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import tcgCardsHero from "@/assets/tcg-cards-hero.png";

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="gradient-blob gradient-blob-pink w-[1000px] h-[1000px] -top-60 right-0 absolute opacity-40" />
        <div className="gradient-blob gradient-blob-purple w-[800px] h-[800px] top-1/3 -left-40 absolute opacity-30" />
        <div className="gradient-blob gradient-blob-cyan w-[600px] h-[600px] bottom-0 right-1/4 absolute opacity-20" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left: Text content */}
          <div className="space-y-6 lg:space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
              <span className="text-foreground">Scan. Collect.</span>
              <br />
              <span className="text-foreground">Flex your pulls.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Snap a card - Save it to your collection, and add to your profile's top 8 instantly. Add a YouTube playlist to your profile to share with your followers. Follow collectors, trade and build your legacy. Marketplace coming soon....
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/scanner">
                <Button className="pill-button-primary gap-2 text-base h-12 px-8">
                  <Sparkles className="w-5 h-5" />
                  Start Scanning
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" className="pill-button-secondary gap-2 text-base h-12 px-8">
                  <Globe className="w-5 h-5" />
                  Explore Feed
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: TCG Cards Collage */}
          <div className="relative h-[550px] md:h-[650px] lg:h-[750px] flex items-center justify-center">
            {/* Glow effect behind image */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl rounded-full scale-90" />
            <img 
              src={tcgCardsHero} 
              alt="Collection of trading cards from various games including Marvel, Pokémon, One Piece, and more" 
              className="relative w-full max-w-3xl mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500 object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
