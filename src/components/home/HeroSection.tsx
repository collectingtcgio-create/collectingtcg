import { Link } from "react-router-dom";
import { Camera, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative py-12 lg:py-16 overflow-hidden">
      {/* Gradient blobs */}
      <div className="gradient-blob gradient-blob-purple w-[500px] h-[500px] -top-40 -left-40 absolute" />
      <div className="gradient-blob gradient-blob-cyan w-[400px] h-[400px] top-20 right-0 absolute" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-foreground">Pull something crazy?</span>
              <br />
              <span className="gradient-text">Scan it. Track it. Show it off.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Use the scanner to capture your pulls and instantly add them to your profile, collection, or marketplace. Follow collectors, share hits, and build your presence.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/scanner">
                <Button className="pill-button-primary gap-2 text-base">
                  <Camera className="w-5 h-5" />
                  Scanner
                </Button>
              </Link>
              <Button variant="ghost" className="pill-button-secondary gap-2 text-base">
                <Globe className="w-5 h-5" />
                Explore Feed
              </Button>
            </div>
          </div>

          {/* Right: Device mockups */}
          <div className="relative h-[400px] lg:h-[500px] hidden md:block">
            {/* Desktop mockup */}
            <div className="device-frame absolute right-0 top-8 w-[380px] h-[260px] rotate-2 z-10">
              <div className="w-full h-full bg-gradient-to-br from-card to-muted p-3">
                {/* Fake feed UI */}
                <div className="h-6 mb-3 flex items-center gap-2">
                  <div className="w-20 h-4 rounded bg-muted-foreground/20" />
                  <div className="w-12 h-4 rounded bg-primary/30" />
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-secondary/30" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-24 h-3 rounded bg-muted-foreground/30" />
                      <div className="w-full h-2 rounded bg-muted-foreground/20" />
                      <div className="w-3/4 h-2 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="w-16 h-20 rounded bg-accent/20" />
                  </div>
                  <div className="flex gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/30" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-20 h-3 rounded bg-muted-foreground/30" />
                      <div className="w-2/3 h-2 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="w-16 h-20 rounded bg-secondary/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile mockup - overlapping */}
            <div className="device-frame device-frame-mobile absolute left-0 bottom-0 w-[180px] h-[340px] -rotate-6 z-20">
              <div className="w-full h-full bg-gradient-to-br from-card to-muted p-2.5">
                {/* Fake scanner result UI */}
                <div className="h-4 mb-2 flex justify-center">
                  <div className="w-16 h-1 rounded-full bg-muted-foreground/40" />
                </div>
                <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-2 flex items-center justify-center">
                  <div className="w-3/4 h-3/4 rounded-lg bg-muted/50" />
                </div>
                <div className="space-y-1.5 px-1">
                  <div className="w-full h-3 rounded bg-muted-foreground/30" />
                  <div className="w-2/3 h-2 rounded bg-muted-foreground/20" />
                  <div className="flex gap-1 mt-2">
                    <div className="flex-1 h-6 rounded-full bg-primary/40" />
                    <div className="flex-1 h-6 rounded-full bg-muted/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative glow behind devices */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-primary/5 rounded-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
