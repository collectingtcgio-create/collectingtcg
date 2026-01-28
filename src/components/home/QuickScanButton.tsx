import { Link } from "react-router-dom";
import { Camera, Zap, Sparkles } from "lucide-react";

interface QuickScanButtonProps {
  variant?: "tile" | "floating";
}

export function QuickScanButton({ variant = "tile" }: QuickScanButtonProps) {
  if (variant === "floating") {
    return (
      <Link
        to="/scanner"
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Quick Scan"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
          
          {/* Button */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 neon-glow-cyan">
            <Camera className="w-7 h-7 text-primary-foreground" />
          </div>
          
          {/* Sparkle accents */}
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-secondary animate-pulse" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/scanner"
      className="glass-card p-4 neon-border-magenta h-full group hover:neon-glow-magenta transition-all duration-300 flex flex-col items-center justify-center text-center"
    >
      {/* Icon Container */}
      <div className="relative mb-3">
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:blur-2xl transition-all" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Camera className="w-8 h-8 text-primary-foreground" />
        </div>
        <Zap className="absolute -top-1 -right-1 w-5 h-5 text-secondary animate-bounce" />
      </div>

      {/* Text */}
      <h3 className="text-lg font-bold mb-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Quick Scan
      </h3>
      <p className="text-xs text-muted-foreground max-w-[140px]">
        Scan a card to instantly identify & add to your collection
      </p>

      {/* Action indicator */}
      <div className="mt-3 flex items-center gap-1 text-xs text-primary group-hover:text-secondary transition-colors">
        <span>Tap to start</span>
        <Sparkles className="w-3 h-3 animate-pulse" />
      </div>
    </Link>
  );
}
