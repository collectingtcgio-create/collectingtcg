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
import { Check, ImageOff, Search } from "lucide-react";
import type { CardResult, TcgGame } from "./ScanResultModal";
import { TCG_GAME_LABELS } from "./ScanResultModal";

// Game-specific placeholder images
const PLACEHOLDER_IMAGES: Record<TcgGame, string> = {
  pokemon: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=560&fit=crop&auto=format",
  magic: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=400&h=560&fit=crop&auto=format",
  onepiece: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=560&fit=crop&auto=format",
  lorcana: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400&h=560&fit=crop&auto=format",
  yugioh: "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=400&h=560&fit=crop&auto=format",
  dragonball: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=560&fit=crop&auto=format",
  marvel: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=560&fit=crop&auto=format",
  unionarena: "https://images.unsplash.com/photo-1585504198199-20277593b94f?w=400&h=560&fit=crop&auto=format",
};

interface CardSelectionGridProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CardResult[];
  onSelect: (card: CardResult) => void;
  onManualSearch: () => void;
}

export function CardSelectionGrid({
  open,
  onOpenChange,
  cards,
  onSelect,
  onManualSearch,
}: CardSelectionGridProps) {
  const getImageUrl = (card: CardResult) => {
    if (card.image_url) return card.image_url;
    if (card.tcg_game) return PLACEHOLDER_IMAGES[card.tcg_game];
    return null;
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getVariantBadge = (card: CardResult) => {
    if (!card.variant || card.variant === 'standard' || card.variant === 'non-foil') return null;
    
    const variantColors: Record<string, string> = {
      foil: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      holo: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
      'reverse holo': 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      'alt-art': 'bg-gradient-to-r from-green-500 to-teal-500 text-white',
      enchanted: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
    };
    
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${variantColors[card.variant] || 'bg-secondary/50'}`}>
        {card.variant.toUpperCase()}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-2xl mx-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Select Your Card
          </DialogTitle>
          <DialogDescription>
            We found {cards.length} possible matches. Select the correct version.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {/* Grid Layout for Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pr-4">
            {cards.map((card, index) => {
              const imageUrl = getImageUrl(card);
              const price = card.price_market || card.price_estimate;
              
              return (
                <button
                  key={card.id || index}
                  onClick={() => onSelect(card)}
                  className="group relative rounded-lg overflow-hidden glass-card hover:neon-border-cyan transition-all duration-300 text-left"
                >
                  {/* Card Image */}
                  <div className="aspect-[2.5/3.5] relative bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={card.card_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <div className="flex items-center gap-1 text-white text-sm font-medium">
                        <Check className="w-4 h-4" />
                        <span>Select</span>
                      </div>
                    </div>

                    {/* Variant Badge */}
                    {getVariantBadge(card) && (
                      <div className="absolute top-2 right-2">
                        {getVariantBadge(card)}
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-2 space-y-1">
                    <h4 className="font-semibold text-foreground text-sm truncate">
                      {card.card_name}
                    </h4>
                    
                    <div className="flex flex-wrap gap-1">
                      {card.set_code && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {card.set_code}
                        </Badge>
                      )}
                      {card.rarity && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-secondary/20">
                          {card.rarity}
                        </Badge>
                      )}
                      {card.card_number && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          #{card.card_number}
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    {price ? (
                      <p className="text-sm font-bold text-secondary">
                        {formatPrice(price)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No price data
                      </p>
                    )}

                    {/* TCG Badge */}
                    {card.tcg_game && (
                      <Badge variant="default" className="text-[9px] px-1 py-0 bg-primary/20 text-primary">
                        {TCG_GAME_LABELS[card.tcg_game]}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-2 border-t border-border/30">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onManualSearch}
          >
            <Search className="w-4 h-4 mr-2" />
            Manual Search
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
