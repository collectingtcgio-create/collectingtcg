import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="gradient-blob gradient-blob-pink w-[600px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute opacity-25" />
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
          Ready to scan your first card?
        </h2>
        <Link to="/scanner">
          <Button className="pill-button-primary gap-2 text-lg px-8 py-6">
            <Sparkles className="w-5 h-5" />
            Start Scanning
          </Button>
        </Link>
      </div>
    </section>
  );
}