import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ImageOff } from "lucide-react";
import type { CardResult } from "./ScanResultModal";
import { TCG_GAME_LABELS } from "./ScanResultModal";

// One Piece card back placeholder
const ONE_PIECE_CARD_BACK = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=560&fit=crop&auto=format";

interface CardSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CardResult[];
  onSelect: (card: CardResult) => void;
}

export function CardSelectionModal({
  open,
  onOpenChange,
  cards,
  onSelect,
}: CardSelectionModalProps) {
  const getImageUrl = (card: CardResult) => {
    if (card.image_url) return card.image_url;
    if (card.tcg_game === 'onepiece') return ONE_PIECE_CARD_BACK;
    return null;
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-lg mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Multiple Matches Found
          </DialogTitle>
          <DialogDescription>
            We found {cards.length} possible matches. Select the correct card.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-4">
            {cards.map((card, index) => {
              const imageUrl = getImageUrl(card);
              const price = card.price_market || card.price_estimate;
              
              return (
                <button
                  key={card.id || index}
                  onClick={() => onSelect(card)}
                  className="w-full p-3 rounded-lg glass-card hover:neon-border-cyan transition-all duration-300 text-left"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-22 rounded-md overflow-hidden bg-muted shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={card.card_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {card.card_name}
                      </h4>
                      {card.set_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {card.set_name}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {card.tcg_game && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {TCG_GAME_LABELS[card.tcg_game]}
                          </Badge>
                        )}
                        {card.rarity && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/20">
                            {card.rarity}
                          </Badge>
                        )}
                        {card.card_number && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            #{card.card_number}
                          </Badge>
                        )}
                      </div>
                      {price && (
                        <p className="text-sm font-medium text-secondary mt-1">
                          {formatPrice(price)}
                        </p>
                      )}
                    </div>

                    {/* Select indicator */}
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-colors">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="pt-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
