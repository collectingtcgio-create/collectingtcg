import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { BookPlus, Check, ExternalLink, Loader2, ImageOff, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import type { TcgScanResult } from "@/hooks/useTcgScan";

const GAME_LABELS: Record<string, string> = {
  one_piece: "One Piece",
  pokemon: "Pokémon",
  dragonball: "Dragon Ball",
  yugioh: "Yu-Gi-Oh!",
  magic: "Magic: The Gathering",
  lorcana: "Lorcana",
  non_game: "Non-TCG Card",
} as const;

interface TcgScanResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: TcgScanResult | null;
  onAddToBinder: (result: TcgScanResult, useCapturedImage?: boolean) => Promise<boolean>;
  isAdding?: boolean;
  capturedImage?: string | null;
}

export function TcgScanResultModal({
  open,
  onOpenChange,
  result,
  onAddToBinder,
  isAdding = false,
  capturedImage,
}: TcgScanResultModalProps) {
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [useCustomImage, setUseCustomImage] = useState(false);
  const isNonGameCard = result?.game === "non_game";

  if (!result || !result.cardName) return null;

  // For non-game cards or when no API image, use the captured image by default
  const shouldUseCapturedImage = useCustomImage || isNonGameCard || (!result.imageUrl && capturedImage);
  const displayImage = shouldUseCapturedImage && capturedImage 
    ? capturedImage 
    : (imageError ? (capturedImage || null) : result.imageUrl);

  const handleAddToBinder = async () => {
    // Pass whether we're using the captured image
    const success = await onAddToBinder(result, useCustomImage || (!result.imageUrl && !!capturedImage));
    if (success) {
      setAdded(true);
    }
  };

  const formatPrice = (price: number | null, isNonGame: boolean = false) => {
    if (isNonGame) return "N/A - Non-TCG";
    if (price === null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) {
        setAdded(false);
        setImageError(false);
        setUseCustomImage(false);
      }
    }}>
      <DialogContent className="glass-card border-border/50 max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Card Identified!
          </DialogTitle>
          <DialogDescription>
            {result.source === "cache" ? "Found in cache" : "Live lookup complete"}
            {result.confidence > 0 && ` • ${Math.round(result.confidence * 100)}% confidence`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card Image */}
          <div className="relative overflow-hidden rounded-xl neon-border-cyan">
            <AspectRatio ratio={2.5 / 3.5}>
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={result.cardName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2">
                  <ImageOff className="w-12 h-12 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">No image available</span>
                </div>
              )}
            </AspectRatio>
            
            {/* Holographic overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
          </div>

          {/* Image options when no image or error */}
          {(imageError || !result.imageUrl) && capturedImage && (
            <div className="flex gap-2">
              <Button
                variant={useCustomImage ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setUseCustomImage(true)}
              >
                Use Captured Image
              </Button>
              <Button
                variant={!useCustomImage ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setUseCustomImage(false)}
              >
                Use Placeholder
              </Button>
            </div>
          )}

          {/* Card Details */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">{result.cardName}</h3>
              {result.set && (
                <p className="text-sm text-muted-foreground">{result.set}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {result.game && (
                <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                  {GAME_LABELS[result.game]}
                </Badge>
              )}
              {result.number && (
                <Badge variant="outline" className="border-border/50">
                  #{result.number}
                </Badge>
              )}
            </div>

            {/* Price Section */}
            <div className="glass-card-magenta p-4 rounded-lg space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Market Prices
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Low Price */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <TrendingDown className="w-3 h-3" />
                    <span className="text-xs">Low</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatPrice(result.prices.low, isNonGameCard)}
                  </p>
                </div>

                {/* Market Price */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-secondary mb-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-xs">Market</span>
                  </div>
                  <p className="font-bold text-lg text-secondary">
                    {formatPrice(result.prices.market, isNonGameCard)}
                  </p>
                </div>

                {/* High Price */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-accent mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs">High</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatPrice(result.prices.high, isNonGameCard)}
                  </p>
                </div>
              </div>

              {isNonGameCard ? (
                <p className="text-xs text-muted-foreground text-center">
                  This appears to be a sports/collectible card. Pricing unavailable through TCG APIs.
                </p>
              ) : result.prices.market === null && (
                <p className="text-xs text-muted-foreground text-center">
                  Pricing unavailable for this card
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAddToBinder}
              disabled={isAdding || added}
              className={`flex-1 rounded-full transition-all duration-300 ${
                added
                  ? "bg-green-600 hover:bg-green-600"
                  : "bg-primary hover:bg-primary/80 hover:neon-glow-cyan"
              }`}
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : added ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <BookPlus className="w-4 h-4 mr-2" />
              )}
              {added ? "Added to Binder" : "Add to Binder"}
            </Button>
            
            {result.imageUrl && !imageError && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full shrink-0"
                onClick={() => window.open(result.imageUrl!, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
