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
  ImageOff, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Crop,
  RotateCcw,
  X,
  Pencil
} from "lucide-react";
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
  onAddToBinder: (result: TcgScanResult, useCapturedImage?: boolean, quantity?: number, customPrice?: number | null, croppedImage?: string | null) => Promise<boolean>;
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
  // All hooks must be at the top, before any conditional returns
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [showPriceEdit, setShowPriceEdit] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>("");
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

    // Calculate crop region
    const minX = Math.min(cropStart.x, cropEnd.x) / 100;
    const maxX = Math.max(cropStart.x, cropEnd.x) / 100;
    const minY = Math.min(cropStart.y, cropEnd.y) / 100;
    const maxY = Math.max(cropStart.y, cropEnd.y) / 100;

    const srcX = img.naturalWidth * minX;
    const srcY = img.naturalHeight * minY;
    const srcW = img.naturalWidth * (maxX - minX);
    const srcH = img.naturalHeight * (maxY - minY);

    if (srcW < 10 || srcH < 10) return; // Minimum crop size

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

  // Now we can have conditional return
  if (!result || !result.cardName) return null;

  const isNonGameCard = result.game === "non_game";
  const originalPrice = result.prices.market;
  const displayPrice = customPrice !== "" ? parseFloat(customPrice) : originalPrice;

  // For non-game cards or when no API image, use the captured image by default
  const shouldUseCapturedImage = useCustomImage || isNonGameCard || (!result.imageUrl && capturedImage);
  const displayImage = croppedImage 
    ? croppedImage 
    : (shouldUseCapturedImage && capturedImage 
      ? capturedImage 
      : (imageError ? (capturedImage || null) : result.imageUrl));

  const handleAddToBinder = async () => {
    const qty = parseInt(quantity) || 1;
    const priceToUse = customPrice !== "" ? parseFloat(customPrice) : null;
    const imageToUse = croppedImage || (useCustomImage && capturedImage) || (!result.imageUrl && capturedImage);
    
    const success = await onAddToBinder(result, !!imageToUse, qty, priceToUse, croppedImage);
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

  const handleRevertPrice = () => {
    setCustomPrice("");
    setShowPriceEdit(false);
  };

  // Crop functionality
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

  // Get crop selection style
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
        setImageError(false);
        setUseCustomImage(false);
        setQuantity("1");
        setShowPriceEdit(false);
        setCustomPrice("");
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
            {result.source === "cache" ? "Found in cache" : "Live lookup complete"}
            {result.confidence > 0 && ` • ${Math.round(result.confidence * 100)}% confidence`}
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
                  alt={result.cardName}
                  className={`w-full h-full object-cover ${showCropTool ? 'cursor-crosshair' : ''}`}
                  onError={() => setImageError(true)}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/20 flex flex-col items-center justify-center gap-2 relative">
                  <div className="absolute inset-4 rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      <ImageOff className="w-8 h-8 text-primary/60" />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium">Card Back</span>
                    <span className="text-muted-foreground/60 text-xs">Image unavailable</span>
                  </div>
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
            
            {/* Holographic overlay */}
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
          {(imageError || !result.imageUrl) && capturedImage && !showCropTool && (
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
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {showPriceEdit ? "Custom Price" : "Market Prices"}
                </p>
                {!isNonGameCard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setShowPriceEdit(!showPriceEdit)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    {showPriceEdit ? "Hide" : "Edit"}
                  </Button>
                )}
              </div>
              
              {showPriceEdit ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={originalPrice !== null ? `Original: ${formatPrice(originalPrice)}` : "Enter price..."}
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="bg-background/50 flex-1"
                    />
                    {customPrice !== "" && (
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
                    <p className={`font-bold text-lg ${customPrice !== "" ? "text-accent" : "text-secondary"}`}>
                      {formatPrice(displayPrice, isNonGameCard)}
                    </p>
                    {customPrice !== "" && (
                      <p className="text-xs text-muted-foreground">(custom)</p>
                    )}
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
              )}

              {isNonGameCard ? (
                <p className="text-xs text-muted-foreground text-center">
                  This appears to be a sports/collectible card. Pricing unavailable through TCG APIs.
                </p>
              ) : result.prices.market === null && !showPriceEdit && (
                <p className="text-xs text-muted-foreground text-center">
                  Pricing unavailable for this card
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
                Total: {formatPrice((displayPrice || 0) * parseInt(quantity || "1"), isNonGameCard)}
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
