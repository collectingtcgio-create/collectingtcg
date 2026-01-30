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
import { ImageOff, Search, Check } from "lucide-react";
import type { TcgScanCandidate } from "@/hooks/useTcgScan";

interface TcgCandidateGridProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: TcgScanCandidate[];
  onSelect: (candidate: TcgScanCandidate) => void;
  onManualSearch?: () => void;
  capturedImage?: string | null;
}

export function TcgCandidateGrid({
  open,
  onOpenChange,
  candidates,
  onSelect,
  onManualSearch,
  capturedImage,
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
            Select Your Card
          </DialogTitle>
          <DialogDescription>
            {candidates.length > 0 
              ? `Found ${candidates.length} possible matches. Tap to select the correct one.`
              : "No matches found. Try searching manually."}
          </DialogDescription>
        </DialogHeader>

        {/* Show captured image preview */}
        {capturedImage && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Your scanned card:</p>
            <div className="w-24 h-auto mx-auto">
              <AspectRatio ratio={2.5 / 3.5}>
                <img
                  src={capturedImage}
                  alt="Scanned card"
                  className="w-full h-full object-cover rounded-lg border border-primary/30"
                />
              </AspectRatio>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {candidates.map((candidate, index) => (
              <button
                key={`${candidate.cardName}-${candidate.number}-${index}`}
                onClick={() => onSelect(candidate)}
                className="glass-card p-3 rounded-lg hover:neon-border-cyan transition-all duration-300 text-left group relative"
              >
                {/* Selection indicator */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check className="w-4 h-4 text-primary" />
                </div>

                {/* Card Image */}
                <div className="relative overflow-hidden rounded-lg mb-2">
                  <AspectRatio ratio={2.5 / 3.5}>
                    {candidate.imageUrl ? (
                      <img
                        src={candidate.imageUrl}
                        alt={candidate.cardName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // If image fails to load, show placeholder
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-muted flex items-center justify-center ${candidate.imageUrl ? 'hidden' : ''}`}>
                      <ImageOff className="w-8 h-8 text-muted-foreground" />
                    </div>
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
                    <p className="text-xs text-primary font-medium">
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
