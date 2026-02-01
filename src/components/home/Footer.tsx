import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-6 border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>Impros uciag</span>
          <span className="text-primary font-medium">Lovable</span>
          <span>|</span>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <span>|</span>
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <span>|</span>
          <a href="#" className="hover:text-foreground transition-colors">Social</a>
          <Heart className="w-4 h-4 text-primary" />
        </div>
      </div>
    </footer>
  );
}