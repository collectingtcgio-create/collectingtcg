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
import { BookPlus, Check, ExternalLink, Loader2 } from "lucide-react";

export interface CardResult {
  id?: string;
  card_name: string;
  image_url: string | null;
  price_estimate: number | null;
  set_name?: string;
  rarity?: string;
  card_number?: string;
}

interface ScanResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CardResult | null;
  onAddToBinder: () => Promise<boolean | void>;
  isAdding?: boolean;
  isAlreadyAdded?: boolean;
}

export function ScanResultModal({
  open,
  onOpenChange,
  card,
  onAddToBinder,
  isAdding = false,
  isAlreadyAdded = false,
}: ScanResultModalProps) {
  const [added, setAdded] = useState(isAlreadyAdded);

  const handleAddToBinder = async () => {
    await onAddToBinder();
    setAdded(true);
  };

  if (!card) return null;

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Card Identified!
          </DialogTitle>
          <DialogDescription>
            We found a match for your scanned card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card Image */}
          <div className="relative overflow-hidden rounded-xl neon-border-cyan">
            <AspectRatio ratio={2.5 / 3.5}>
              {card.image_url ? (
                <img
                  src={card.image_url}
                  alt={card.card_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </AspectRatio>
            
            {/* Holographic overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
          </div>

          {/* Card Details */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">{card.card_name}</h3>
              {card.set_name && (
                <p className="text-sm text-muted-foreground">{card.set_name}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {card.rarity && (
                <Badge variant="secondary" className="bg-secondary/20 text-secondary border-secondary/30">
                  {card.rarity}
                </Badge>
              )}
              {card.card_number && (
                <Badge variant="outline" className="border-border/50">
                  #{card.card_number}
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="glass-card-magenta p-4 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Market Price
              </p>
              <p className="text-2xl font-bold text-secondary">
                {formatPrice(card.price_estimate)}
              </p>
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
            
            {card.image_url && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full shrink-0"
                onClick={() => window.open(card.image_url!, "_blank")}
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
