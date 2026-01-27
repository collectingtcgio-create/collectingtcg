import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Crop, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  userId: string;
}

export function ImageUpload({ onUpload, currentUrl, userId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [cardType, setCardType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const detectCardCrop = async (imageBase64: string) => {
    setDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-card-crop", {
        body: { imageBase64 },
      });

      if (error) throw error;

      if (data.detected && data.cropBox) {
        setCropBox(data.cropBox);
        setCardType(data.cardType || "Trading Card");
        toast({
          title: "Card detected!",
          description: `Found a ${data.cardType || "trading card"} (${data.confidence}% confidence). Click 'Apply Crop' to use.`,
        });
      } else {
        toast({
          title: "No card detected",
          description: data.message || "Try a clearer photo with the card more visible.",
        });
      }
    } catch (error: any) {
      console.error("Crop detection error:", error);
      toast({
        title: "Detection failed",
        description: "Could not analyze image. You can still upload as-is.",
        variant: "destructive",
      });
    } finally {
      setDetecting(false);
    }
  };

  const applyCrop = useCallback(async () => {
    if (!originalImage || !cropBox || !canvasRef.current) return;

    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      // Calculate actual pixel values from percentages
      const cropX = (cropBox.x / 100) * img.width;
      const cropY = (cropBox.y / 100) * img.height;
      const cropWidth = (cropBox.width / 100) * img.width;
      const cropHeight = (cropBox.height / 100) * img.height;

      // Set canvas size to cropped dimensions
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // Draw cropped region
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      // Get cropped image as base64
      const croppedBase64 = canvas.toDataURL("image/jpeg", 0.9);
      setPreview(croppedBase64);
      setCropBox(null);

      toast({
        title: "Crop applied!",
        description: "Card has been cropped. Ready to upload.",
      });
    };
    img.src = originalImage;
  }, [originalImage, cropBox, toast]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    // Show preview and store original
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setOriginalImage(base64);
      setCropBox(null);
      setCardType(null);

      // Auto-detect card crop
      await detectCardCrop(base64);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!preview) return;

    setUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(preview);
      const blob = await response.blob();

      const fileExt = "jpg";
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("card-images")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("card-images")
        .getPublicUrl(fileName);

      onUpload(data.publicUrl);
      toast({
        title: "Image uploaded!",
        description: "Your card image has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setOriginalImage(null);
    setCropBox(null);
    setCardType(null);
    onUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium mb-2 block">
        Card Image (optional)
      </label>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />

      {preview ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-border bg-card/50">
            <img
              src={preview}
              alt="Card preview"
              className="w-full h-48 object-contain bg-background/50"
            />
            {cropBox && (
              <div 
                className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`,
                }}
              />
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
            {cardType && (
              <div className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full">
                {cardType} detected
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {cropBox && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyCrop}
                className="flex-1"
              >
                <Crop className="h-4 w-4 mr-2" />
                Apply Crop
              </Button>
            )}
            {detecting ? (
              <Button type="button" variant="outline" size="sm" disabled className="flex-1">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Detecting...
              </Button>
            ) : originalImage && !cropBox ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => detectCardCrop(originalImage)}
                className="flex-1"
              >
                <Crop className="h-4 w-4 mr-2" />
                Re-detect Card
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={uploadImage}
              disabled={uploading}
              className="flex-1 bg-primary hover:bg-primary/80"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {uploading ? "Uploading..." : "Confirm Upload"}
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
        >
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Upload from device</p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG up to 20MB • AI auto-crops cards
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <p className="text-xs text-muted-foreground text-center">
        Or paste an image URL below
      </p>
    </div>
  );
}
