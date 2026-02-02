import { Link } from "react-router-dom";
import { Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

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
              Snap a card — we identify it, price it, and save it to your profile instantly. Follow collectors, trade, and build your legacy.
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

          {/* Right: Device mockups - stacked and overlapping */}
          <div className="relative h-[500px] lg:h-[600px] hidden md:flex items-center justify-center">
            {/* Desktop mockup - back left */}
            <div className="device-frame absolute left-0 top-8 w-[340px] h-[230px] -rotate-2 z-10">
              <div className="w-full h-full bg-gradient-to-br from-card to-muted p-3">
                {/* Fake dashboard header */}
                <div className="h-5 mb-2 flex items-center gap-2 border-b border-border/30 pb-2">
                  <div className="w-3 h-3 rounded-full bg-primary/40" />
                  <div className="w-16 h-2.5 rounded bg-muted-foreground/20" />
                  <div className="w-8 h-2.5 rounded bg-primary/30 ml-auto" />
                </div>
                {/* Feed items */}
                <div className="space-y-2">
                  <div className="flex gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="w-6 h-6 rounded-full bg-secondary/30" />
                    <div className="flex-1 space-y-1">
                      <div className="w-16 h-2 rounded bg-muted-foreground/30" />
                      <div className="w-24 h-1.5 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="w-12 h-14 rounded bg-gradient-to-br from-primary/20 to-accent/20" />
                  </div>
                  <div className="flex gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="w-6 h-6 rounded-full bg-primary/30" />
                    <div className="flex-1 space-y-1">
                      <div className="w-14 h-2 rounded bg-muted-foreground/30" />
                      <div className="w-20 h-1.5 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="w-12 h-14 rounded bg-gradient-to-br from-secondary/20 to-primary/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile mockup - front right */}
            <div className="device-frame device-frame-mobile absolute right-8 top-0 w-[220px] h-[420px] rotate-3 z-30">
              <div className="w-full h-full bg-gradient-to-br from-card to-muted p-3">
                {/* App header */}
                <div className="h-6 mb-3 flex justify-between items-center">
                  <div className="w-20 h-3.5 rounded bg-primary/40" />
                  <div className="w-6 h-6 rounded-full bg-muted/50" />
                </div>
                {/* Tab bar */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 h-6 rounded-full bg-primary/30 flex items-center justify-center">
                    <div className="w-10 h-2 rounded bg-primary-foreground/40" />
                  </div>
                  <div className="flex-1 h-6 rounded-full bg-muted/40" />
                </div>
                {/* Card display with character */}
                <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-orange-500/20 via-primary/15 to-accent/20 mb-3 relative overflow-hidden">
                  <div className="absolute inset-4 rounded-lg bg-gradient-to-br from-orange-400/30 to-red-500/30 flex items-center justify-center">
                    <div className="w-16 h-20 rounded bg-muted/30" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/80 text-[10px] text-white font-medium">
                      One Piece
                    </span>
                    <span className="text-[10px] text-muted-foreground">$340</span>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded-full bg-primary/60" />
                    <div className="flex-1 h-8 rounded-full bg-muted/50 border border-border/30" />
                  </div>
                  <div className="h-6 rounded-lg bg-muted/30" />
                </div>
              </div>
            </div>

            {/* Additional mobile mockup - far right showing card detail */}
            <div className="device-frame device-frame-mobile absolute right-0 top-20 w-[200px] h-[380px] rotate-6 z-20">
              <div className="w-full h-full bg-gradient-to-br from-card to-muted p-3">
                <div className="h-5 mb-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-muted/50" />
                  <div className="flex-1" />
                  <div className="w-5 h-5 rounded bg-muted/50" />
                </div>
                {/* Large card image */}
                <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-primary/20 mb-2 relative overflow-hidden">
                  <div className="absolute inset-3 rounded-lg bg-muted/20" />
                </div>
                {/* Card info */}
                <div className="space-y-1.5 px-1">
                  <div className="w-full h-3 rounded bg-muted-foreground/30" />
                  <div className="w-2/3 h-2 rounded bg-muted-foreground/20" />
                  <div className="w-1/2 h-2 rounded bg-primary/30" />
                </div>
              </div>
            </div>

            {/* Floating card accent elements */}
            <div className="absolute left-20 bottom-16 w-16 h-20 rounded-xl bg-gradient-to-br from-secondary/40 to-primary/30 rotate-12 z-0 blur-sm opacity-60" />
          </div>
        </div>
      </div>
    </section>
  );
}
