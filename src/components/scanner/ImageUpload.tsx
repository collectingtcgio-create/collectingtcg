import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Crop, Loader2, Check, Move } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ResizeHandle = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se" | "move" | null;

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
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, box: { x: 0, y: 0, width: 0, height: 0 } });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const detectCardCrop = async (imageBase64: string) => {
    setDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-card-crop", {
        body: { imageBase64 },
      });

      if (error) throw error;

      if (data.detected && data.cropBox) {
        // Ensure the crop box is properly sized for horizontal cards
        const detectedBox = data.cropBox;
        // If AI returned a narrow/square box, adjust to card aspect ratio (roughly 3.5:2.5 for horizontal)
        const minWidth = 30; // Minimum 30% width
        const adjustedBox = {
          ...detectedBox,
          width: Math.max(detectedBox.width, minWidth),
        };
        setCropBox(adjustedBox);
        setCardType(data.cardType || "Trading Card");
        toast({
          title: "Card detected!",
          description: `Found a ${data.cardType || "trading card"} (${data.confidence}% confidence). Drag edges to adjust crop.`,
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

  // Handle mouse/touch interactions for crop resizing
  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imageContainerRef.current) return { x: 0, y: 0 };
    const rect = imageContainerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleDragStart = (handle: ResizeHandle) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cropBox) return;
    setIsDragging(true);
    setActiveHandle(handle);
    const pos = getEventPosition(e);
    setDragStart({ x: pos.x, y: pos.y, box: { ...cropBox } });
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !cropBox || !imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const currentX = ((clientX - rect.left) / rect.width) * 100;
    const currentY = ((clientY - rect.top) / rect.height) * 100;
    
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;
    const startBox = dragStart.box;
    
    let newBox = { ...cropBox };
    const minSize = 10; // Minimum 10% for width/height
    
    switch (activeHandle) {
      case "move":
        newBox.x = Math.max(0, Math.min(100 - startBox.width, startBox.x + deltaX));
        newBox.y = Math.max(0, Math.min(100 - startBox.height, startBox.y + deltaY));
        break;
      case "nw":
        newBox.x = Math.max(0, Math.min(startBox.x + startBox.width - minSize, startBox.x + deltaX));
        newBox.y = Math.max(0, Math.min(startBox.y + startBox.height - minSize, startBox.y + deltaY));
        newBox.width = startBox.width - (newBox.x - startBox.x);
        newBox.height = startBox.height - (newBox.y - startBox.y);
        break;
      case "n":
        newBox.y = Math.max(0, Math.min(startBox.y + startBox.height - minSize, startBox.y + deltaY));
        newBox.height = startBox.height - (newBox.y - startBox.y);
        break;
      case "ne":
        newBox.y = Math.max(0, Math.min(startBox.y + startBox.height - minSize, startBox.y + deltaY));
        newBox.width = Math.max(minSize, Math.min(100 - startBox.x, startBox.width + deltaX));
        newBox.height = startBox.height - (newBox.y - startBox.y);
        break;
      case "w":
        newBox.x = Math.max(0, Math.min(startBox.x + startBox.width - minSize, startBox.x + deltaX));
        newBox.width = startBox.width - (newBox.x - startBox.x);
        break;
      case "e":
        newBox.width = Math.max(minSize, Math.min(100 - startBox.x, startBox.width + deltaX));
        break;
      case "sw":
        newBox.x = Math.max(0, Math.min(startBox.x + startBox.width - minSize, startBox.x + deltaX));
        newBox.width = startBox.width - (newBox.x - startBox.x);
        newBox.height = Math.max(minSize, Math.min(100 - startBox.y, startBox.height + deltaY));
        break;
      case "s":
        newBox.height = Math.max(minSize, Math.min(100 - startBox.y, startBox.height + deltaY));
        break;
      case "se":
        newBox.width = Math.max(minSize, Math.min(100 - startBox.x, startBox.width + deltaX));
        newBox.height = Math.max(minSize, Math.min(100 - startBox.y, startBox.height + deltaY));
        break;
    }
    
    setCropBox(newBox);
  }, [isDragging, cropBox, dragStart, activeHandle]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
  }, []);

  // Set up global mouse/touch listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const uploadImage = useCallback(async (imageData: string) => {
    setUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
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
        description: "Your card image has been saved.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload image",
        variant: "destructive",
      });
      return false;
    } finally {
      setUploading(false);
    }
  }, [userId, onUpload, toast]);

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

      // Auto-upload after crop
      await uploadImage(croppedBase64);
    };
    img.src = originalImage;
  }, [originalImage, cropBox, uploadImage]);

  const handleSkipCropAndUpload = useCallback(async () => {
    if (!preview) return;
    await uploadImage(preview);
  }, [preview, uploadImage]);

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
          <div 
            ref={imageContainerRef}
            className="relative rounded-lg overflow-hidden border border-border bg-card/50 select-none"
          >
            <img
              src={preview}
              alt="Card preview"
              className="w-full h-64 object-contain bg-background/50"
              draggable={false}
            />
            {cropBox && (
              <>
                {/* Darkened overlay outside crop area */}
                <div 
                  className="absolute inset-0 bg-black/50 pointer-events-none"
                  style={{
                    clipPath: `polygon(
                      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                      ${cropBox.x}% ${cropBox.y}%, 
                      ${cropBox.x}% ${cropBox.y + cropBox.height}%, 
                      ${cropBox.x + cropBox.width}% ${cropBox.y + cropBox.height}%, 
                      ${cropBox.x + cropBox.width}% ${cropBox.y}%, 
                      ${cropBox.x}% ${cropBox.y}%
                    )`,
                  }}
                />
                {/* Crop box with border */}
                <div 
                  className="absolute border-2 border-primary cursor-move"
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.width}%`,
                    height: `${cropBox.height}%`,
                  }}
                  onMouseDown={handleDragStart("move")}
                  onTouchStart={handleDragStart("move")}
                >
                  {/* Move indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-primary/80 rounded-full p-1.5">
                      <Move className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                  
                  {/* Corner handles */}
                  <div 
                    className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-primary rounded-sm cursor-nw-resize border-2 border-primary-foreground"
                    onMouseDown={handleDragStart("nw")}
                    onTouchStart={handleDragStart("nw")}
                  />
                  <div 
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-sm cursor-ne-resize border-2 border-primary-foreground"
                    onMouseDown={handleDragStart("ne")}
                    onTouchStart={handleDragStart("ne")}
                  />
                  <div 
                    className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-primary rounded-sm cursor-sw-resize border-2 border-primary-foreground"
                    onMouseDown={handleDragStart("sw")}
                    onTouchStart={handleDragStart("sw")}
                  />
                  <div 
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary rounded-sm cursor-se-resize border-2 border-primary-foreground"
                    onMouseDown={handleDragStart("se")}
                    onTouchStart={handleDragStart("se")}
                  />
                  
                  {/* Edge handles */}
                  <div 
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-primary rounded-sm cursor-n-resize border-2 border-primary-foreground"
                    onMouseDown={handleDragStart("n")}
                    onTouchStart={handleDragStart("n")}
                  />
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-primary rounded-sm cursor-s-resize border-2 border-primary-foreground"
                    onMouseDown={handleDragStart("s")}
                    onTouchStart={handleDragStart("s")}
                  />
                  <div 
                    className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-8 bg-primary rounded-sm cursor-w-resize border-2 border-primary-foreground"
                    onMouseDown={handleDragStart("w")}
                    onTouchStart={handleDragStart("w")}
                  />
                  <div 
                    className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-8 bg-primary rounded-sm cursor-e-resize border-2 border-primary-foreground"
                    onMouseDown={handleDragStart("e")}
                    onTouchStart={handleDragStart("e")}
                  />
                </div>
              </>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full z-10"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
            {cardType && (
              <div className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full z-10">
                {cardType} detected
              </div>
            )}
            {cropBox && (
              <div className="absolute bottom-2 right-2 bg-muted/90 text-muted-foreground text-xs px-2 py-1 rounded-full z-10">
                Drag corners/edges to adjust
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
              onClick={handleSkipCropAndUpload}
              disabled={uploading}
              className="flex-1 bg-primary hover:bg-primary/80"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {uploading ? "Uploading..." : "Upload Image"}
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
