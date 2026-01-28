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
import { CardResult, TCG_GAME_LABELS } from "./ScanResultModal";

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
  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-lg mx-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Select Your Card
          </DialogTitle>
          <DialogDescription>
            We found {cards.length} possible matches. Choose the correct one:
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3">
            {cards.map((card, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full h-auto p-3 flex items-start gap-3 hover:neon-border-cyan transition-all"
                onClick={() => onSelect(card)}
              >
                {/* Card thumbnail */}
                <div className="w-16 h-22 shrink-0 rounded-md overflow-hidden bg-muted">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.card_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                </div>

                {/* Card info */}
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">{card.card_name}</p>
                  {card.set_name && (
                    <p className="text-xs text-muted-foreground">{card.set_name}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {card.tcg_game && (
                      <Badge variant="default" className="text-xs bg-primary/20 text-primary">
                        {TCG_GAME_LABELS[card.tcg_game]}
                      </Badge>
                    )}
                    {card.rarity && (
                      <Badge variant="secondary" className="text-xs">
                        {card.rarity}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-secondary">
                    {formatPrice(card.price_estimate)}
                  </p>
                  {card.confidence && (
                    <p className="text-xs text-muted-foreground">
                      {Math.round(card.confidence * 100)}% match
                    </p>
                  )}
                </div>
              </Button>
            ))}
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
