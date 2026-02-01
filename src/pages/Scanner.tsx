import { useState, useRef, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CameraView, CameraViewHandle } from "@/components/scanner/CameraView";
import { GameSelector } from "@/components/scanner/GameSelector";
import { Camera, X, Check, RotateCcw } from "lucide-react";
import type { TcgGame } from "@/components/scanner/ScanResultModal";

const SAVE_SCAN_IMAGE_URL = "https://uvjulnwoacftborhhhnr.supabase.co/functions/v1/save-scan-image";

export default function Scanner() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const cameraRef = useRef<CameraViewHandle>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<TcgGame | 'auto'>('auto');
  const [isAdding, setIsAdding] = useState(false);

  // Manual add form
  const [cardName, setCardName] = useState("");
  const [priceEstimate, setPriceEstimate] = useState("");

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
    cameraRef.current?.startCamera();
  }, []);

  const handleAddToCollection = async () => {
    if (!profile || !capturedImage) return;

    setIsAdding(true);

    try {
      const cardNameToUse = cardName.trim() || `Card ${new Date().toISOString().slice(0, 10)}`;
      const gameToUse = selectedGame !== 'auto' ? selectedGame : 'pokemon';
      
      // Save image to storage
      console.log(">>> [BEFORE] Calling save-scan-image Edge Function...");
      
      let savedImageUrl: string | null = null;
      try {
        const response = await fetch(SAVE_SCAN_IMAGE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: capturedImage,
            cardName: cardNameToUse,
            game: gameToUse,
          }),
        });
        
        console.log("<<< [AFTER] save-scan-image Edge Function returned");
        
        if (response.ok) {
          const data = await response.json();
          savedImageUrl = data.imageUrl;
          console.log("[handleAddToCollection] Saved image URL:", savedImageUrl);
        }
      } catch (error) {
        console.error("[handleAddToCollection] Failed to save image:", error);
      }

      // Add to collection
      const { error } = await supabase.from("user_cards").insert({
        user_id: profile.id,
        card_name: cardNameToUse,
        image_url: savedImageUrl || capturedImage,
        price_estimate: priceEstimate ? parseFloat(priceEstimate) : 0,
        tcg_game: gameToUse,
      });

      if (error) throw error;

      // Add to activity feed
      await supabase.from("activity_feed").insert({
        user_id: profile.id,
        activity_type: "capture",
        description: `Added "${cardNameToUse}" to their collection`,
        metadata: {
          card_name: cardNameToUse,
          tcg_game: gameToUse,
        },
      });

      toast({
        title: "Card Added!",
        description: `${cardNameToUse} has been added to your collection.`,
      });

      // Reset and go to collections
      setCapturedImage(null);
      setCardName("");
      setPriceEstimate("");
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

              {/* Start Camera Button */}
              {!isCameraActive && (
                <div className="mt-6">
                  <Button
                    onClick={() => cameraRef.current?.startCamera()}
                    className="w-full rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300 h-12"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Captured Image Preview */
            <div className="space-y-4">
              <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border border-border">
                <img 
                  src={capturedImage} 
                  alt="Captured card" 
                  className="w-full h-full object-cover"
                />
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
                    Price (optional)
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
                      <Check className="w-4 h-4 mr-2" />
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
