import { Link } from "react-router-dom";
import { Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background gradient blobs */}
      <div className="gradient-blob gradient-blob-pink w-[800px] h-[800px] -top-40 -right-40 absolute opacity-30" />
      <div className="gradient-blob gradient-blob-purple w-[600px] h-[600px] top-1/2 left-0 absolute opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-foreground">Scan. Collect.</span>
              <br />
              <span className="text-foreground">Flex your pulls.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Snap a card — we identify it, price it, and save it to your profile instantly. Follow collectors, trade, and build your legacy.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/scanner">
                <Button className="pill-button-primary gap-2 text-base">
                  <Sparkles className="w-5 h-5" />
                  Start Scanning
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" className="pill-button-secondary gap-2 text-base">
                  <Globe className="w-5 h-5" />
                  Explore Feed
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Device mockups */}
          <div className="relative h-[450px] lg:h-[550px] hidden md:block">
            {/* Desktop mockup */}
            <div className="device-frame absolute right-0 top-4 w-[420px] h-[280px] rotate-2 z-10">
              <div className="w-full h-full bg-gradient-to-br from-card to-muted p-3">
                {/* Fake dashboard UI */}
                <div className="h-6 mb-3 flex items-center gap-2 border-b border-border/30 pb-2">
                  <div className="w-3 h-3 rounded-full bg-primary/40" />
                  <div className="w-20 h-3 rounded bg-muted-foreground/20" />
                  <div className="w-12 h-3 rounded bg-primary/30 ml-auto" />
                </div>
                <div className="grid grid-cols-3 gap-2 h-[calc(100%-40px)]">
                  <div className="col-span-2 space-y-2">
                    <div className="flex gap-2 p-2 rounded-lg bg-muted/50">
                      <div className="w-7 h-7 rounded-full bg-secondary/30" />
                      <div className="flex-1 space-y-1">
                        <div className="w-20 h-2.5 rounded bg-muted-foreground/30" />
                        <div className="w-full h-2 rounded bg-muted-foreground/20" />
                      </div>
                      <div className="w-14 h-16 rounded bg-accent/20" />
                    </div>
                    <div className="flex gap-2 p-2 rounded-lg bg-muted/50">
                      <div className="w-7 h-7 rounded-full bg-primary/30" />
                      <div className="flex-1 space-y-1">
                        <div className="w-16 h-2.5 rounded bg-muted-foreground/30" />
                        <div className="w-3/4 h-2 rounded bg-muted-foreground/20" />
                      </div>
                      <div className="w-14 h-16 rounded bg-secondary/20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                      <div className="w-10 h-12 rounded bg-muted/60" />
                    </div>
                    <div className="h-12 rounded-lg bg-muted/40" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile mockup - overlapping */}
            <div className="device-frame device-frame-mobile absolute left-8 bottom-0 w-[200px] h-[380px] -rotate-6 z-20">
              <div className="w-full h-full bg-gradient-to-br from-card to-muted p-3">
                {/* Fake app header */}
                <div className="h-5 mb-3 flex justify-between items-center">
                  <div className="w-16 h-3 rounded bg-primary/40" />
                  <div className="w-6 h-6 rounded-full bg-muted/50" />
                </div>
                {/* Card display */}
                <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 mb-3 flex items-center justify-center relative overflow-hidden">
                  <div className="w-3/4 h-3/4 rounded-lg bg-muted/50 border border-border/30" />
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-primary/80 text-[8px] text-primary-foreground font-medium">
                    $340
                  </div>
                </div>
                {/* Card info */}
                <div className="space-y-2 px-1">
                  <div className="w-full h-3 rounded bg-muted-foreground/30" />
                  <div className="w-2/3 h-2 rounded bg-muted-foreground/20" />
                  <div className="flex gap-1.5 mt-3">
                    <div className="flex-1 h-7 rounded-full bg-primary/50" />
                    <div className="flex-1 h-7 rounded-full bg-muted/50 border border-border/30" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating card accent */}
            <div className="absolute right-12 bottom-8 w-24 h-32 rounded-xl bg-gradient-to-br from-secondary/30 to-primary/20 rotate-12 blur-sm opacity-60" />
          </div>
        </div>
      </div>
    </section>
  );
}