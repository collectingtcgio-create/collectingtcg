import { useState, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCardScanner } from "@/hooks/useCardScanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CameraView, CameraViewHandle } from "@/components/scanner/CameraView";
import { ScanResultModal } from "@/components/scanner/ScanResultModal";
import { NoCardDetectedModal } from "@/components/scanner/NoCardDetectedModal";
import { ImageUpload } from "@/components/scanner/ImageUpload";
import { Sparkles, X, Search } from "lucide-react";

export default function Scanner() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const cameraRef = useRef<CameraViewHandle>(null);

  const {
    isProcessing,
    scanResult,
    showResult,
    setShowResult,
    showNoCardModal,
    setShowNoCardModal,
    isAddingToBinder,
    identifyCard,
    addToBinder,
    resetScanner,
  } = useCardScanner();

  // Manual add form
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [cardName, setCardName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [priceEstimate, setPriceEstimate] = useState("");

  const handleCapture = useCallback(async () => {
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

    // Send to identification function
    await identifyCard(imageData);
  }, [identifyCard, toast]);

  const handleTryAgain = useCallback(() => {
    resetScanner();
    cameraRef.current?.startCamera();
  }, [resetScanner]);

  const handleSearchManually = useCallback(() => {
    resetScanner();
    setShowManualAdd(true);
  }, [resetScanner]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !cardName.trim()) return;

    const { error } = await supabase.from("user_cards").insert({
      user_id: profile.id,
      card_name: cardName.trim(),
      image_url: imageUrl.trim() || null,
      price_estimate: priceEstimate ? parseFloat(priceEstimate) : 0,
    });

    if (error) {
      toast({
        title: "Failed to add card",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Add to activity feed
    await supabase.from("activity_feed").insert({
      user_id: profile.id,
      activity_type: "manual_add",
      description: `Manually added "${cardName.trim()}" to their collection`,
    });

    toast({
      title: "Card added!",
      description: `${cardName} has been added to your collection.`,
    });

    setCardName("");
    setImageUrl("");
    setPriceEstimate("");
    setShowManualAdd(false);
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
            Card Scanner
          </h1>
          <p className="text-muted-foreground">
            Scan trading cards to add them to your collection
          </p>
        </div>

        {/* Scanner Area */}
        {!showManualAdd ? (
          <div className="glass-card p-6 neon-border-cyan">
            {/* Camera View Component */}
            <CameraView ref={cameraRef} isProcessing={isProcessing} />

            {/* Capture Button */}
            {cameraRef.current?.isActive && !isProcessing && (
              <div className="mt-6">
                <Button
                  onClick={handleCapture}
                  className="w-full rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:neon-glow-magenta transition-all duration-300 h-14 text-lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Capture & Identify
                </Button>
              </div>
            )}

            {/* Start Camera Button (when camera not active) */}
            {!cameraRef.current?.isActive && !isProcessing && (
              <div className="mt-6">
                <Button
                  onClick={() => cameraRef.current?.startCamera()}
                  className="w-full rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300 h-12"
                >
                  Start Scanning
                </Button>
              </div>
            )}

            {/* Manual Add Option */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowManualAdd(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Or add a card manually →
              </button>
            </div>
          </div>
        ) : (
          /* Manual Add Form */
          <div className="glass-card p-6 neon-border-magenta fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add Card Manually</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowManualAdd(false)}
                className="rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Card Name *
                </label>
                <Input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g., Charizard VMAX"
                  required
                  className="bg-input border-border"
                />
              </div>

              {/* Image Upload */}
              <ImageUpload
                userId={profile.id}
                currentUrl={imageUrl}
                onUpload={(url) => setImageUrl(url)}
              />

              {/* URL Input as fallback */}
              <div>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... (or upload above)"
                  type="url"
                  className="bg-input border-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Estimated Value (optional)
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

              <Button
                type="submit"
                className="w-full rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300"
              >
                Add to Collection
              </Button>
            </form>
          </div>
        )}

        {/* Scan Result Modal */}
        <ScanResultModal
          open={showResult}
          onOpenChange={(open) => {
            setShowResult(open);
            if (!open) resetScanner();
          }}
          card={scanResult}
          onAddToBinder={addToBinder}
          isAdding={isAddingToBinder}
        />

        {/* No Card Detected Modal */}
        <NoCardDetectedModal
          open={showNoCardModal}
          onOpenChange={setShowNoCardModal}
          onTryAgain={handleTryAgain}
          onSearchManually={handleSearchManually}
        />
      </div>
    </Layout>
  );
}
