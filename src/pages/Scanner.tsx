import { useState, useRef, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/image-utils";
import { useToast } from "@/hooks/use-toast";
import { CameraView, CameraViewHandle } from "@/components/scanner/CameraView";
import { GameSelector } from "@/components/scanner/GameSelector";
import { Camera, Upload, RotateCcw, Minus, Plus, Crop } from "lucide-react";
import type { TcgGame } from "@/components/scanner/ScanResultModal";
import { ImageEditor } from "@/components/scanner/ImageEditor";



export default function Scanner() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const cameraRef = useRef<CameraViewHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<TcgGame | 'auto'>('auto');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Manual add form
  const [cardName, setCardName] = useState("");
  const [priceEstimate, setPriceEstimate] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(20, prev + delta)));
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCapturedImage(base64);
      // Stop camera if it was active
      cameraRef.current?.stopCamera();
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [toast]);

  const handleCapture = useCallback(() => {
    if (!cameraRef.current) return;

    const imageData = cameraRef.current.captureFrame();
    if (!imageData) {
      toast({
        title: "Capture failed",
        description: "Could not capture frame from camera.",
        variant: "destructive",
      });
      return;
    }

    setCapturedImage(imageData);
    cameraRef.current.stopCamera();
  }, [toast]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setCardName("");
    setPriceEstimate("");
    setQuantity(1);
    cameraRef.current?.startCamera();
  }, []);

  const handleAddToCollection = async () => {
    console.log("[Scanner] handleAddToCollection called. Profile:", !!profile, "Image:", !!capturedImage);

    if (!capturedImage) {
      toast({
        title: "No image",
        description: "Please capture or upload an image first.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      let activeProfile = profile;

      // Profile recovery: if profile is null but user exists, try to fetch it directly
      if (!activeProfile && user) {
        console.log("[Scanner] Profile missing, attempting recovery fetch for UID:", user.id);
        const { data: recoveredProfile, error: recoveryError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (recoveredProfile) {
          console.log("[Scanner] Profile recovered:", recoveredProfile.username);
          activeProfile = recoveredProfile;
        } else {
          console.error("[Scanner] Profile recovery failed:", recoveryError);
        }
      }

      if (!activeProfile) {
        toast({
          title: "Profile not loaded",
          description: "We couldn't retrieve your user profile. Please check your connection and try again.",
          variant: "destructive",
        });
        setIsAdding(false);
        return;
      }

      const cardNameToUse = cardName.trim() || `Card ${new Date().toISOString().slice(0, 10)}`;
      const gameToUse = selectedGame !== 'auto' ? selectedGame : 'pokemon';

      // 1. Compress image before any further processing
      console.log(">>> [BEFORE] Compressing image...");
      let finalImageData = capturedImage;
      try {
        finalImageData = await compressImage(capturedImage, 1200, 0.7);
        console.log("<<< [AFTER] Image compressed. Length:", finalImageData.length);
      } catch (err) {
        console.error("Compression failed, using original:", err);
      }

      // 2. Save image to storage via Edge Function
      console.log(">>> [BEFORE] Calling save-scan-image Edge Function...");
      let savedImageUrl: string | null = null;
      try {
        const { data, error: functionError } = await supabase.functions.invoke("save-scan-image", {
          body: {
            imageBase64: finalImageData,
            cardName: cardNameToUse,
            game: gameToUse,
          },
        });

        console.log("<<< [AFTER] save-scan-image Edge Function returned");

        if (functionError) {
          console.error("[handleAddToCollection] Edge Function error:", functionError);
          // If the image is too large even after compression, the function might fail
          toast({
            title: "Upload warning",
            description: "Could not save high-quality image. Using temporary link instead.",
            variant: "default",
          });
        } else if (data?.imageUrl) {
          savedImageUrl = data.imageUrl;
          console.log("[handleAddToCollection] Saved image URL:", savedImageUrl);
        }
      } catch (error) {
        console.error("[handleAddToCollection] Failed to call Edge Function:", error);
      }

      // 3. Parse price safely
      let parsedPrice = 0;
      if (priceEstimate) {
        // Remove currency symbols and non-numeric chars except dot
        const cleanPrice = priceEstimate.replace(/[^0-9.]/g, '');
        parsedPrice = parseFloat(cleanPrice) || 0;
      }

      // 4. Add to collection
      const { error } = await supabase.from("user_cards").insert({
        user_id: activeProfile.id,
        card_name: cardNameToUse,
        image_url: savedImageUrl || finalImageData,
        price_estimate: parsedPrice,
        tcg_game: gameToUse,
        quantity: quantity,
      });

      if (error) {
        console.error("Database insert error:", error);
        throw new Error(`Failed to save to database: ${error.message}`);
      }

      // Add to activity feed
      await supabase.from("activity_feed").insert({
        user_id: activeProfile.id,
        activity_type: "capture",
        description: quantity > 1
          ? `Added ${quantity}x "${cardNameToUse}" to their collection`
          : `Added "${cardNameToUse}" to their collection`,
        metadata: {
          card_name: cardNameToUse,
          tcg_game: gameToUse,
          quantity: quantity,
        },
      });

      toast({
        title: "Card Added!",
        description: quantity > 1
          ? `${quantity}x ${cardNameToUse} has been added to your collection.`
          : `${cardNameToUse} has been added to your collection.`,
      });

      // Reset and go to collections
      setCapturedImage(null);
      setCardName("");
      setPriceEstimate("");
      setQuantity(1);
      navigate("/collections");
    } catch (error) {
      console.error("Error adding card:", error);
      toast({
        title: "Failed to add card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      {isEditing && capturedImage && (
        <ImageEditor
          image={capturedImage}
          onSave={(newImage) => {
            setCapturedImage(newImage);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      )}
      <div className="container mx-auto px-4 max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Capture Card
          </h1>
          <p className="text-muted-foreground">
            Take a photo to add to your collection or marketplace
          </p>
        </div>

        <div className="glass-card p-6 neon-border-cyan">
          {/* Game Selector */}
          <GameSelector
            value={selectedGame}
            onChange={setSelectedGame}
            disabled={isAdding}
          />

          {/* Camera View or Captured Image */}
          {!capturedImage ? (
            <>
              <CameraView
                ref={cameraRef}
                isProcessing={false}
                onCameraStateChange={setIsCameraActive}
              />

              {/* Capture Button */}
              {isCameraActive && (
                <div className="mt-6">
                  <Button
                    onClick={handleCapture}
                    className="w-full rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:neon-glow-magenta transition-all duration-300 h-14 text-lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Capture Photo
                  </Button>
                </div>
              )}

              {/* Start Camera & Upload Buttons */}
              {!isCameraActive && (
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={() => cameraRef.current?.startCamera()}
                    className="w-full rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300 h-12"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full rounded-full h-12 border-border hover:bg-muted"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </>
          ) : (
            /* Captured Image Preview */
            <div className="space-y-4">
              <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border border-border group">
                <img
                  src={capturedImage}
                  alt="Captured card"
                  className="w-full h-full object-contain bg-black/50"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-4 right-4 shadow-lg hover:scale-105 transition-transform"
                  onClick={() => setIsEditing(true)}
                >
                  <Crop className="w-4 h-4 mr-2" />
                  Edit Image
                </Button>
              </div>

              {/* Card Details Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block text-muted-foreground">
                    Card Name (optional)
                  </label>
                  <Input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g., Charizard VMAX"
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-muted-foreground">
                    Price per card (optional)
                  </label>
                  <Input
                    value={priceEstimate}
                    onChange={(e) => setPriceEstimate(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-muted-foreground">
                    Quantity (1-20)
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="h-10 w-10 rounded-full"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(20, val)));
                      }}
                      type="number"
                      min="1"
                      max="20"
                      className="bg-input border-border text-center w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= 20}
                      className="h-10 w-10 rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  className="flex-1"
                  disabled={isAdding}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={handleAddToCollection}
                  className="flex-1 bg-primary hover:bg-primary/80"
                  disabled={isAdding}
                >
                  {isAdding ? (
                    "Adding..."
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Collection
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
