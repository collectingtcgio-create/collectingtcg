import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-8 border-t border-border/20 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-sm text-muted-foreground">
          <span className="text-muted-foreground/60">Impros uciag</span>
          <span className="text-primary font-semibold">Lovable</span>
          <span className="text-muted-foreground/40">|</span>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <span className="text-muted-foreground/40">|</span>
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <span className="text-muted-foreground/40">|</span>
          <a href="#" className="hover:text-foreground transition-colors">Social</a>
          <Heart className="w-4 h-4 text-primary/60" />
        </div>
      </div>
    </footer>
  );
}
