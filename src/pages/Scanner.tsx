import { useState, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCardScanner } from "@/hooks/useCardScanner";
import { useTcgScan, type TcgScanResult } from "@/hooks/useTcgScan";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CameraView, CameraViewHandle } from "@/components/scanner/CameraView";
import { ScanResultModal, CardResult, TcgGame } from "@/components/scanner/ScanResultModal";
import { TcgScanResultModal } from "@/components/scanner/TcgScanResultModal";
import { TcgCandidateGrid } from "@/components/scanner/TcgCandidateGrid";
import { NoCardDetectedModal } from "@/components/scanner/NoCardDetectedModal";
import { CardSelectionGrid } from "@/components/scanner/CardSelectionGrid";
import { CardNameSearch } from "@/components/scanner/CardNameSearch";
import { ImageUpload } from "@/components/scanner/ImageUpload";
import { GameSelector } from "@/components/scanner/GameSelector";
import { Sparkles, X, Search, Type, Zap } from "lucide-react";

export default function Scanner() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const cameraRef = useRef<CameraViewHandle>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<TcgGame | 'auto'>('auto');
  const [useLivePricing, setUseLivePricing] = useState(true); // Use production pipeline by default
  const [showTcgResult, setShowTcgResult] = useState(false);
  const [showTcgCandidates, setShowTcgCandidates] = useState(false);
  const [isAddingFromTcg, setIsAddingFromTcg] = useState(false);

  // New production-safe TCG scan hook
  const {
    isScanning: isTcgScanning,
    scanResult: tcgScanResult,
    candidates: tcgCandidates,
    remainingScans,
    scanCard: tcgScanCard,
    selectCandidate: tcgSelectCandidate,
    resetScan: tcgResetScan,
  } = useTcgScan();

  // Legacy scanner hook (for games other than One Piece / Pokémon)
  const {
    isProcessing,
    scanResults,
    selectedCard,
    showResult,
    setShowResult,
    showSelectionModal,
    setShowSelectionModal,
    showNoCardModal,
    setShowNoCardModal,
    isAddingToBinder,
    identifyCard,
    selectCard,
    addToBinder,
    resetScanner,
  } = useCardScanner();

  // Manual add form
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [showCardSearch, setShowCardSearch] = useState(false);
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

    // Save captured image for potential use in modal
    setCapturedImage(imageData);

    // Use production TCG scan pipeline for One Piece/Pokémon when live pricing is enabled
    if (useLivePricing && (selectedGame === 'onepiece' || selectedGame === 'pokemon' || selectedGame === 'auto' || selectedGame === 'dragonball')) {
      const result = await tcgScanCard(imageData);
      if (result) {
        // Always show candidate grid if we have candidates (even if just 1) so user can confirm
        if (result.candidates && result.candidates.length > 0) {
          setShowTcgCandidates(true);
        } else if (result.cardName && !result.error) {
          // Single result with no candidates array - show directly
          setShowTcgResult(true);
        } else if (result.error) {
          // Fall back to legacy scanner if production pipeline fails
          const gameHint = selectedGame !== 'auto' ? selectedGame : undefined;
          await identifyCard(imageData, gameHint);
        }
      }
    } else {
      // Use legacy scanner for other games
      const gameHint = selectedGame !== 'auto' ? selectedGame : undefined;
      await identifyCard(imageData, gameHint);
    }
  }, [identifyCard, toast, selectedGame, useLivePricing, tcgScanCard]);

  const handleTryAgain = useCallback(() => {
    resetScanner();
    tcgResetScan();
    setCapturedImage(null);
    setShowTcgResult(false);
    setShowTcgCandidates(false);
    cameraRef.current?.startCamera();
  }, [resetScanner, tcgResetScan]);

  const handleSearchManually = useCallback(() => {
    resetScanner();
    tcgResetScan();
    setShowManualAdd(true);
  }, [resetScanner, tcgResetScan]);

  const handleCardSearchSelect = useCallback((card: CardResult) => {
    // Show the result modal with the selected card from search
    selectCard(card);
  }, [selectCard]);

  const handleTcgCandidateSelect = useCallback((candidate: any) => {
    tcgSelectCandidate(candidate);
    setShowTcgCandidates(false);
    setShowTcgResult(true);
  }, [tcgSelectCandidate]);

  const handleAddFromTcgScan = useCallback(async (result: TcgScanResult, useCapturedImage?: boolean): Promise<boolean> => {
    if (!profile || !result.cardName) return false;

    setIsAddingFromTcg(true);

    try {
      // Map game to tcg_game enum
      const tcgGameMap: Record<string, TcgGame | null> = {
        one_piece: 'onepiece',
        pokemon: 'pokemon',
        dragonball: 'dragonball',
      };
      const tcgGame = result.game ? tcgGameMap[result.game] : null;

      // Determine which image to use - prefer API image, fallback to captured
      const imageToSave = result.imageUrl || (useCapturedImage && capturedImage ? capturedImage : null);

      const { error: insertError } = await supabase.from("user_cards").insert({
        user_id: profile.id,
        card_name: result.cardName,
        image_url: imageToSave,
        price_estimate: result.prices.market || 0,
        tcg_game: tcgGame || null,
      });

      if (insertError) throw insertError;

      // Add to activity feed
      await supabase.from("activity_feed").insert({
        user_id: profile.id,
        activity_type: "scan",
        description: `Scanned and added "${result.cardName}" to their collection`,
        metadata: {
          card_name: result.cardName,
          tcg_game: result.game,
          set_name: result.set,
          card_number: result.number,
          price_market: result.prices.market,
        },
      });

      toast({
        title: "Card Added!",
        description: `${result.cardName} has been added to your binder.`,
      });

      return true;
    } catch (error) {
      console.error("Error adding card:", error);
      toast({
        title: "Failed to add card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsAddingFromTcg(false);
    }
  }, [profile, toast, capturedImage]);

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
            {/* Live Pricing Toggle */}
            <div className="flex items-center justify-between mb-4 p-3 bg-secondary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium">Live Pricing (One Piece/Pokémon)</span>
              </div>
              <button
                onClick={() => setUseLivePricing(!useLivePricing)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  useLivePricing ? 'bg-secondary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-1 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    useLivePricing ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Rate limit indicator */}
            {remainingScans !== null && useLivePricing && (
              <div className="mb-4 text-xs text-muted-foreground text-center">
                {remainingScans} scans remaining this minute
              </div>
            )}

            {/* Game Selector */}
            <GameSelector 
              value={selectedGame}
              onChange={setSelectedGame}
              disabled={isProcessing || isTcgScanning}
            />

            {/* Camera View Component */}
            <CameraView 
              ref={cameraRef} 
              isProcessing={isProcessing || isTcgScanning} 
              onCameraStateChange={setIsCameraActive}
            />

            {/* Capture Button */}
            {isCameraActive && !isProcessing && !isTcgScanning && (
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
            {!isCameraActive && !isProcessing && !isTcgScanning && (
              <div className="mt-6">
                <Button
                  onClick={() => cameraRef.current?.startCamera()}
                  className="w-full rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300 h-12"
                >
                  Start Scanning
                </Button>
              </div>
            )}

            {/* Card Name Search + Manual Add Options */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => setShowCardSearch(true)}
                className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2 font-medium"
              >
                <Type className="w-4 h-4" />
                Search by name
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={() => setShowManualAdd(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Add manually
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

              {/* Image Upload with Scan capability */}
              <ImageUpload
                userId={profile.id}
                currentUrl={imageUrl}
                onUpload={(url) => setImageUrl(url)}
                onScanImage={async (imageBase64: string) => {
                  setCapturedImage(imageBase64);
                  const result = await tcgScanCard(imageBase64);
                  if (result) {
                    if (result.candidates && result.candidates.length > 0) {
                      setShowManualAdd(false);
                      setShowTcgCandidates(true);
                    } else if (result.cardName && !result.error) {
                      setShowManualAdd(false);
                      setShowTcgResult(true);
                    }
                  }
                }}
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

        {/* Card Selection Grid (multiple matches) */}
        <CardSelectionGrid
          open={showSelectionModal}
          onOpenChange={setShowSelectionModal}
          cards={scanResults}
          onSelect={selectCard}
          onManualSearch={handleSearchManually}
        />

        {/* Scan Result Modal (single match or after selection) */}
        <ScanResultModal
          open={showResult}
          onOpenChange={(open) => {
            setShowResult(open);
            if (!open) {
              resetScanner();
              setCapturedImage(null);
            }
          }}
          card={selectedCard}
          onAddToBinder={async (updatedCard?: CardResult) => {
            return addToBinder(updatedCard);
          }}
          isAdding={isAddingToBinder}
          capturedImage={capturedImage}
        />

        {/* No Card Detected Modal */}
        <NoCardDetectedModal
          open={showNoCardModal}
          onOpenChange={setShowNoCardModal}
          onTryAgain={handleTryAgain}
          onSearchManually={handleSearchManually}
        />

        {/* Card Name Search Modal */}
        <CardNameSearch
          open={showCardSearch}
          onOpenChange={setShowCardSearch}
          onCardSelect={handleCardSearchSelect}
        />

        {/* TCG Scan Result Modal (production pipeline) */}
        <TcgScanResultModal
          open={showTcgResult}
          onOpenChange={(open) => {
            setShowTcgResult(open);
            if (!open) {
              tcgResetScan();
              setCapturedImage(null);
            }
          }}
          result={tcgScanResult}
          onAddToBinder={handleAddFromTcgScan}
          isAdding={isAddingFromTcg}
          capturedImage={capturedImage}
        />

        {/* TCG Candidate Selection Grid */}
        <TcgCandidateGrid
          open={showTcgCandidates}
          onOpenChange={setShowTcgCandidates}
          candidates={tcgCandidates}
          onSelect={handleTcgCandidateSelect}
          onManualSearch={handleSearchManually}
          capturedImage={capturedImage}
        />
      </div>
    </Layout>
  );
}
