import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageOff, Search } from "lucide-react";
import type { TcgScanCandidate } from "@/hooks/useTcgScan";

interface TcgCandidateGridProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: TcgScanCandidate[];
  onSelect: (candidate: TcgScanCandidate) => void;
  onManualSearch?: () => void;
}

export function TcgCandidateGrid({
  open,
  onOpenChange,
  candidates,
  onSelect,
  onManualSearch,
}: TcgCandidateGridProps) {
  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-2xl mx-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Multiple Matches Found
          </DialogTitle>
          <DialogDescription>
            Select the correct card from the options below
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {candidates.map((candidate, index) => (
              <button
                key={`${candidate.cardName}-${candidate.number}-${index}`}
                onClick={() => onSelect(candidate)}
                className="glass-card p-3 rounded-lg hover:neon-border-cyan transition-all duration-300 text-left group"
              >
                {/* Card Image */}
                <div className="relative overflow-hidden rounded-lg mb-2">
                  <AspectRatio ratio={2.5 / 3.5}>
                    {candidate.imageUrl ? (
                      <img
                        src={candidate.imageUrl}
                        alt={candidate.cardName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageOff className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </AspectRatio>
                </div>

                {/* Card Info */}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {candidate.cardName}
                  </p>
                  {candidate.set && (
                    <p className="text-xs text-muted-foreground truncate">
                      {candidate.set}
                    </p>
                  )}
                  {candidate.number && (
                    <p className="text-xs text-primary">
                      #{candidate.number}
                    </p>
                  )}
                  <p className="text-sm font-bold text-secondary">
                    {formatPrice(candidate.prices.market)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Manual Search Option */}
        {onManualSearch && (
          <div className="pt-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={onManualSearch}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              None of these? Search manually
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
