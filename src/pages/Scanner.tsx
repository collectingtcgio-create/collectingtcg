import { useState, useRef, useCallback, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, CameraOff, Loader2, Sparkles, X } from "lucide-react";

export default function Scanner() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Manual add form
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [cardName, setCardName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [priceEstimate, setPriceEstimate] = useState("");

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setHasPermission(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      setHasPermission(false);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to scan cards.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const handleScan = async () => {
    if (!profile) return;
    
    setIsProcessing(true);
    
    // Simulate scan processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // For demo, we'll show a toast and prompt manual add
    toast({
      title: "Card detected!",
      description: "Please confirm the card details to add to your collection.",
    });
    
    setShowManualAdd(true);
    setIsProcessing(false);
    stopCamera();
  };

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
      activity_type: "scan",
      description: `Added "${cardName.trim()}" to their collection`,
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
            {/* Camera View */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-6 bg-muted">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Overlay */}
                  <div className="absolute inset-8 viewfinder">
                    {isProcessing && <div className="scan-line" />}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm">
                    {hasPermission === false
                      ? "Camera access denied"
                      : "Camera not active"}
                  </p>
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-primary font-semibold">Processing...</p>
                    <p className="text-sm text-muted-foreground">
                      Analyzing card details
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              {!isCameraActive ? (
                <Button
                  onClick={startCamera}
                  className="flex-1 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button
                    onClick={stopCamera}
                    variant="ghost"
                    className="rounded-full"
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                  <Button
                    onClick={handleScan}
                    disabled={isProcessing}
                    className="flex-1 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:neon-glow-magenta transition-all duration-300"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Scan Card
                  </Button>
                </>
              )}
            </div>

            {/* Manual Add Option */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowManualAdd(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Or add a card manually →
              </button>
            </div>
          </div>
        ) : (
          /* Manual Add Form */
          <div className="glass-card p-6 neon-border-magenta fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add Card</h2>
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

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Image URL (optional)
                </label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
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
      </div>
    </Layout>
  );
}
