import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import tcgCardsCollage from "@/assets/tcg-cards-collage.png";

export function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="gradient-blob gradient-blob-pink w-[800px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute opacity-30" />
      <div className="gradient-blob gradient-blob-purple w-[600px] h-[400px] bottom-0 right-0 absolute opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Cards collage image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative">
              {/* Glow effect behind image */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl rounded-full scale-110" />
              <img 
                src={tcgCardsCollage} 
                alt="Collection of trading cards from various games" 
                className="relative w-full max-w-lg mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Right: Text and CTA */}
          <div className="text-center lg:text-left order-1 lg:order-2 space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Ready to scan your first card?
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
              Join thousands of collectors capturing their pulls, building collections, and trading with the community.
            </p>
            <div className="pt-2">
              <Link to="/scanner">
                <Button className="pill-button-primary gap-2 text-lg px-10 h-14">
                  <Sparkles className="w-5 h-5" />
                  Start Scanning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
