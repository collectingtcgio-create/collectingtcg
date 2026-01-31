import { useState, useRef, useCallback } from "react";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BookPlus, 
  Check, 
  ExternalLink, 
  Loader2, 
  DollarSign, 
  ImageOff,
  Crop,
  RotateCcw,
  X,
  Pencil
} from "lucide-react";

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
  onAddToBinder: (updatedCard?: CardResult, quantity?: number) => Promise<boolean | void>;
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
  // All hooks at the top before any conditional returns
  const [added, setAdded] = useState(isAlreadyAdded);
  const [manualPrice, setManualPrice] = useState<string>("");
  const [showManualPrice, setShowManualPrice] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [showCropTool, setShowCropTool] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applyCrop = useCallback(() => {
    if (!cropStart || !cropEnd || !imageRef.current || !canvasRef.current) return;
    
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const minX = Math.min(cropStart.x, cropEnd.x) / 100;
    const maxX = Math.max(cropStart.x, cropEnd.x) / 100;
    const minY = Math.min(cropStart.y, cropEnd.y) / 100;
    const maxY = Math.max(cropStart.y, cropEnd.y) / 100;

    const srcX = img.naturalWidth * minX;
    const srcY = img.naturalHeight * minY;
    const srcW = img.naturalWidth * (maxX - minX);
    const srcH = img.naturalHeight * (maxY - minY);

    if (srcW < 10 || srcH < 10) return;

    canvas.width = srcW;
    canvas.height = srcH;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
    
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCroppedImage(croppedDataUrl);
    setShowCropTool(false);
    setCropStart(null);
    setCropEnd(null);
    setUseCustomImage(true);
  }, [cropStart, cropEnd]);

  // Now conditional return is allowed
  if (!card) return null;

  const hasPrice = card.price_estimate !== null || card.price_market !== null;
  const originalPrice = card.price_market || card.price_estimate;
  const displayPrice = manualPrice ? parseFloat(manualPrice) : originalPrice;
  
  // Determine which image to show
  const getDisplayImage = () => {
    if (croppedImage) return croppedImage;
    if (useCustomImage && capturedImage) return capturedImage;
    if (imageError || !card.image_url) {
      if (card.tcg_game === 'onepiece') return ONE_PIECE_CARD_BACK;
      return capturedImage || null;
    }
    return card.image_url;
  };

  const displayImage = getDisplayImage();

  const handleAddToBinder = async () => {
    const qty = parseInt(quantity) || 1;
    const updatedCard: CardResult = {
      ...card,
      price_estimate: manualPrice ? parseFloat(manualPrice) : displayPrice,
      image_url: croppedImage || (useCustomImage && capturedImage ? capturedImage : card.image_url),
    };

    await onAddToBinder(updatedCard, qty);
    setAdded(true);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const handleRevertPrice = () => {
    setManualPrice("");
    setShowManualPrice(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Crop handlers
  const handleCropStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showCropTool) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCropStart({ x, y });
    setCropEnd({ x, y });
    setIsDragging(true);
  };

  const handleCropMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !cropStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setCropEnd({ x, y });
  };

  const handleCropEnd = () => {
    setIsDragging(false);
  };

  const cancelCrop = () => {
    setShowCropTool(false);
    setCropStart(null);
    setCropEnd(null);
  };

  const resetCrop = () => {
    setCroppedImage(null);
  };

  const getCropStyle = () => {
    if (!cropStart || !cropEnd) return {};
    const left = Math.min(cropStart.x, cropEnd.x);
    const top = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);
    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`,
    };
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) {
        setAdded(false);
        setManualPrice("");
        setShowManualPrice(false);
        setImageError(false);
        setUseCustomImage(false);
        setQuantity("1");
        setShowCropTool(false);
        setCroppedImage(null);
        setCropStart(null);
        setCropEnd(null);
      }
    }}>
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
          {/* Card Image with Crop Tool */}
          <div 
            className="relative overflow-hidden rounded-xl neon-border-cyan"
            onMouseDown={handleCropStart}
            onMouseMove={handleCropMove}
            onMouseUp={handleCropEnd}
            onMouseLeave={handleCropEnd}
          >
            <AspectRatio ratio={2.5 / 3.5}>
              {displayImage ? (
                <img
                  ref={imageRef}
                  src={displayImage}
                  alt={card.card_name}
                  className={`w-full h-full object-cover ${showCropTool ? 'cursor-crosshair' : ''}`}
                  onError={handleImageError}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2">
                  <ImageOff className="w-12 h-12 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">No image available</span>
                </div>
              )}
            </AspectRatio>
            
            {/* Crop overlay */}
            {showCropTool && (
              <div className="absolute inset-0 bg-black/50 pointer-events-none">
                {cropStart && cropEnd && (
                  <div 
                    className="absolute border-2 border-white bg-transparent pointer-events-none"
                    style={getCropStyle()}
                  />
                )}
              </div>
            )}
            
            {/* Holographic overlay effect */}
            {!showCropTool && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
            )}
          </div>

          {/* Hidden canvas for cropping */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Image controls */}
          <div className="flex flex-wrap gap-2">
            {capturedImage && !showCropTool && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setShowCropTool(true)}
                >
                  <Crop className="w-3 h-3 mr-1" />
                  Crop Image
                </Button>
                {croppedImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={resetCrop}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                )}
              </>
            )}
            {showCropTool && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={applyCrop}
                  disabled={!cropStart || !cropEnd}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Apply Crop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={cancelCrop}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </>
            )}
          </div>

          {/* Image options when no image or error */}
          {(imageError || !card.image_url) && capturedImage && !showCropTool && (
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
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {showManualPrice ? "Custom Price" : "Market Price"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowManualPrice(!showManualPrice)}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  {showManualPrice ? "Hide" : "Edit"}
                </Button>
              </div>
              
              {showManualPrice ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={originalPrice !== null ? `Original: ${formatPrice(originalPrice)}` : "Enter price..."}
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="bg-background/50 flex-1"
                    />
                    {manualPrice !== "" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRevertPrice}
                        className="h-8 px-2"
                        title="Revert to original price"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {originalPrice !== null && (
                    <p className="text-xs text-muted-foreground">
                      Original market price: {formatPrice(originalPrice)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className={`text-2xl font-bold ${manualPrice ? "text-accent" : "text-secondary"}`}>
                    {formatPrice(displayPrice)}
                  </p>
                  {manualPrice && (
                    <span className="text-xs text-muted-foreground">(custom)</span>
                  )}
                </div>
              )}
              
              {!hasPrice && !showManualPrice && (
                <p className="text-xs text-muted-foreground mt-2">
                  No market price found. Click Edit to enter a custom price.
                </p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <span className="text-sm font-medium">Quantity:</span>
              <Select value={quantity} onValueChange={setQuantity}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="1" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                Total: {formatPrice((displayPrice || 0) * parseInt(quantity || "1"))}
              </span>
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
              {added ? "Added to Binder" : `Add ${parseInt(quantity) > 1 ? `${quantity}x` : ""} to Binder`}
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
