import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Upload, Loader2, ScanLine, X, Plus, Minus, DollarSign } from "lucide-react";

interface Card {
  id: string;
  card_name: string;
  image_url: string;
  price_estimate: number;
  tcg_game?: string | null;
  quantity: number;
}

interface EditCardModalProps {
  card: Card | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardUpdated: () => void;
}

export function EditCardModal({ card, open, onOpenChange, onCardUpdated }: EditCardModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSavingQuantity, setIsSavingQuantity] = useState(false);
  const [price, setPrice] = useState(0);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  useEffect(() => {
    if (card) {
      setQuantity(card.quantity || 1);
      setPrice(card.price_estimate || 0);
    }
  }, [card]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleClose = () => {
    stopCamera();
    setPreviewUrl(null);
    setQuantity(card?.quantity || 1);
    setPrice(card?.price_estimate || 0);
    onOpenChange(false);
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (!card || newQuantity < 1) return;
    
    setQuantity(newQuantity);
    setIsSavingQuantity(true);
    
    try {
      const { error } = await supabase
        .from("user_cards")
        .update({ quantity: newQuantity })
        .eq("id", card.id);

      if (error) throw error;

      toast({
        title: "Quantity Updated",
        description: `Now tracking ${newQuantity}x ${card.card_name}`,
      });
      
      onCardUpdated();
    } catch (error) {
      setQuantity(card.quantity || 1);
      toast({
        title: "Update Failed",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    } finally {
      setIsSavingQuantity(false);
    }
  };

  const handlePriceChange = async (newPrice: number) => {
    if (!card || newPrice < 0) return;
    
    setPrice(newPrice);
    setIsSavingPrice(true);
    
    try {
      const { error } = await supabase
        .from("user_cards")
        .update({ price_estimate: newPrice })
        .eq("id", card.id);

      if (error) throw error;

      toast({
        title: "Price Updated",
        description: `Price set to $${newPrice.toFixed(2)}`,
      });
      
      onCardUpdated();
    } catch (error) {
      setPrice(card.price_estimate || 0);
      toast({
        title: "Update Failed",
        description: "Failed to update price",
        variant: "destructive",
      });
    } finally {
      setIsSavingPrice(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPreviewUrl(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToStorage = async (imageData: string): Promise<string | null> => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const fileName = `${card?.id}-${Date.now()}.jpg`;
      const filePath = `${card?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("card-images")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("card-images")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleSaveImage = async () => {
    if (!card || !previewUrl) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadImageToStorage(previewUrl);
      
      if (!publicUrl) {
        throw new Error("Failed to upload image");
      }

      const { error } = await supabase
        .from("user_cards")
        .update({ image_url: publicUrl })
        .eq("id", card.id);

      if (error) throw error;

      toast({
        title: "Image Updated",
        description: "Your card image has been updated successfully.",
      });
      
      onCardUpdated();
      handleClose();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRescan = async () => {
    if (!card || !previewUrl) return;

    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Call identify-card-v3 with the new image
      const response = await supabase.functions.invoke("identify-card-v3", {
        body: {
          image_data: previewUrl,
          game_hint: card.tcg_game || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to identify card");
      }

      const result = response.data;

      if (result.success && result.cards && result.cards.length > 0) {
        const identifiedCard = result.cards[0];
        
        // Upload the new image
        const publicUrl = await uploadImageToStorage(previewUrl);

        // Update the card with new data
        const { error: updateError } = await supabase
          .from("user_cards")
          .update({
            card_name: identifiedCard.card_name,
            image_url: publicUrl || identifiedCard.image_url || card.image_url,
            price_estimate: identifiedCard.price_estimate || identifiedCard.price_market || card.price_estimate,
            tcg_game: identifiedCard.tcg_game === 'marvel' ? null : identifiedCard.tcg_game,
          })
          .eq("id", card.id);

        if (updateError) throw updateError;

        toast({
          title: "Card Rescanned",
          description: `Card identified as "${identifiedCard.card_name}"`,
        });
        
        onCardUpdated();
        handleClose();
      } else {
        toast({
          title: "No Card Detected",
          description: "Could not identify a card in the image. Try a clearer photo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Rescan Failed",
        description: error instanceof Error ? error.message : "Failed to rescan card",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Edit Card Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current/Preview Image */}
          <div className="aspect-[2.5/3.5] bg-muted rounded-lg overflow-hidden relative">
            {showCamera ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-background/80"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={capturePhoto}
                    size="icon"
                    className="rounded-full w-14 h-14 bg-primary hover:bg-primary/80"
                  >
                    <Camera className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : card.image_url ? (
              <img
                src={card.image_url}
                alt={card.card_name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>

          {/* Card Info */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Card Name</Label>
              <p className="font-medium">{card.card_name}</p>
            </div>
            
            {/* Quantity Control */}
            <div>
              <Label className="text-sm text-muted-foreground">Quantity</Label>
              <div className="flex items-center gap-3 mt-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1 || isSavingQuantity}
                  className="h-8 w-8"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (val >= 1 && val <= 20) handleQuantityChange(val);
                  }}
                  className="w-20 text-center"
                  disabled={isSavingQuantity}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 20 || isSavingQuantity}
                  className="h-8 w-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                {isSavingQuantity && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Price Control */}
            <div>
              <Label className="text-sm text-muted-foreground">Price per Card ($)</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={price}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (val >= 0) setPrice(val);
                    }}
                    onBlur={() => handlePriceChange(price)}
                    className="pl-8"
                    disabled={isSavingPrice}
                  />
                </div>
                {isSavingPrice && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total value: ${(price * quantity).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {!showCamera && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={startCamera}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </Button>
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Save/Rescan Buttons */}
          {previewUrl && !showCamera && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={handleSaveImage}
                disabled={isUploading || isScanning}
                className="bg-primary hover:bg-primary/80"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Image Only"
                )}
              </Button>
              
              <Button
                onClick={handleRescan}
                disabled={isUploading || isScanning}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4" />
                    Rescan Card
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Clear Preview */}
          {previewUrl && !showCamera && (
            <Button
              variant="ghost"
              onClick={() => setPreviewUrl(null)}
              className="w-full text-muted-foreground"
            >
              Clear Preview
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
