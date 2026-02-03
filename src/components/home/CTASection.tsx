import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="gradient-blob gradient-blob-pink w-[800px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute opacity-30" />
      <div className="gradient-blob gradient-blob-purple w-[600px] h-[400px] bottom-0 right-0 absolute opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
          Ready to scan your first card?
        </h2>
        <Link to="/scanner">
          <Button className="pill-button-primary gap-2 text-lg px-10 h-14">
            <Sparkles className="w-5 h-5" />
            Start Scanning
          </Button>
        </Link>
      </div>
    </section>
  );
}
