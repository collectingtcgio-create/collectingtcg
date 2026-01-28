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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookPlus, Check, ExternalLink, Loader2, DollarSign, ImageOff } from "lucide-react";

export type TcgGame = 'pokemon' | 'magic' | 'yugioh' | 'onepiece' | 'dragonball' | 'lorcana' | 'unionarena' | 'marvel';

export const TCG_GAME_LABELS: Record<TcgGame, string> = {
  pokemon: 'Pokémon',
  magic: 'Magic: The Gathering',
  yugioh: 'Yu-Gi-Oh!',
  onepiece: 'One Piece',
  dragonball: 'Dragon Ball',
  lorcana: 'Disney Lorcana',
  unionarena: 'Union Arena',
  marvel: 'Marvel Non-Sport',
};

// One Piece card back placeholder
const ONE_PIECE_CARD_BACK = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=560&fit=crop&auto=format";

export interface CardResult {
  id?: string;
  card_name: string;
  tcg_game?: TcgGame;
  image_url: string | null;
  price_estimate: number | null;
  set_name?: string;
  set_code?: string;
  rarity?: string;
  card_number?: string;
  confidence?: number;
  price_market?: number;
  price_foil?: number;
  variant?: string;
}

interface ScanResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CardResult | null;
  onAddToBinder: (updatedCard?: CardResult) => Promise<boolean | void>;
  isAdding?: boolean;
  isAlreadyAdded?: boolean;
  capturedImage?: string | null;
}

export function ScanResultModal({
  open,
  onOpenChange,
  card,
  onAddToBinder,
  isAdding = false,
  isAlreadyAdded = false,
  capturedImage,
}: ScanResultModalProps) {
  const [added, setAdded] = useState(isAlreadyAdded);
  const [manualPrice, setManualPrice] = useState<string>("");
  const [showManualPrice, setShowManualPrice] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [useCustomImage, setUseCustomImage] = useState(false);

  if (!card) return null;

  const hasPrice = card.price_estimate !== null || card.price_market !== null;
  const displayPrice = card.price_market || card.price_estimate;
  
  // Determine which image to show
  const getDisplayImage = () => {
    if (useCustomImage && capturedImage) {
      return capturedImage;
    }
    if (imageError || !card.image_url) {
      // Use placeholder for One Piece cards without images
      if (card.tcg_game === 'onepiece') {
        return ONE_PIECE_CARD_BACK;
      }
      return null;
    }
    return card.image_url;
  };

  const displayImage = getDisplayImage();

  const handleAddToBinder = async () => {
    // Build updated card with manual price if entered
    const updatedCard: CardResult = {
      ...card,
      price_estimate: manualPrice ? parseFloat(manualPrice) : displayPrice,
      image_url: useCustomImage && capturedImage ? capturedImage : card.image_url,
    };

    await onAddToBinder(updatedCard);
    setAdded(true);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-md mx-auto max-h-[90vh] overflow-y-auto">
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
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={card.card_name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2">
                  <ImageOff className="w-12 h-12 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">No image available</span>
                </div>
              )}
            </AspectRatio>
            
            {/* Holographic overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
          </div>

          {/* Image options when no image or error */}
          {(imageError || !card.image_url) && capturedImage && (
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
              <h3 className="text-lg font-bold text-foreground">{card.card_name}</h3>
              {card.set_name && (
                <p className="text-sm text-muted-foreground">{card.set_name}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {card.tcg_game && (
                <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                  {TCG_GAME_LABELS[card.tcg_game]}
                </Badge>
              )}
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

            {/* Price Section */}
            <div className="glass-card-magenta p-4 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Market Price
              </p>
              {hasPrice && !showManualPrice ? (
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-secondary">
                    {formatPrice(displayPrice)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualPrice(true)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter price..."
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  {!hasPrice && (
                    <p className="text-xs text-muted-foreground">
                      No market price found. Enter a custom price.
                    </p>
                  )}
                </div>
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
            
            {card.image_url && !imageError && (
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
