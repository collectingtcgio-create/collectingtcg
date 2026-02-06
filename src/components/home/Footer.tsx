import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-8 border-t border-border/20 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <span className="text-muted-foreground/40">|</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-support-modal'))}
            className="hover:text-foreground transition-colors"
          >
            Support
          </button>
          <span className="text-muted-foreground/40">|</span>
          <a href="#" className="hover:text-foreground transition-colors">Social</a>
        </div>
      </div>
    </footer>
  );
}
