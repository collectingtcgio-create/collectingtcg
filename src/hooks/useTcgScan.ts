import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";


export interface TcgScanPrices {
  low: number | null;
  market: number | null;
  high: number | null;
}

export interface TcgScanCandidate {
  cardName: string;
  set: string | null;
  number: string | null;
  imageUrl: string | null;
  prices: TcgScanPrices;
  productId?: string | null;
}

export interface TcgScanResult {
  game: "one_piece" | "pokemon" | "dragonball" | "yugioh" | "magic" | "lorcana" | "non_game" | null;
  cardName: string | null;
  set: string | null;
  number: string | null;
  imageUrl: string | null;
  prices: TcgScanPrices;
  confidence: number;
  source: "cache" | "live";
  error: string | null;
  candidates?: TcgScanCandidate[];
  productId?: string | null;
}

interface SaveImageResponse {
  imageUrl: string;
  title: string;
  cached: boolean;
}

interface GetImageResponse {
  imageUrl: string | null;
  exists: boolean;
}

interface UseTcgScanReturn {
  isScanning: boolean;
  scanResult: TcgScanResult | null;
  candidates: TcgScanCandidate[];
  remainingScans: number | null;
  scanCard: (imageData: string) => Promise<TcgScanResult | null>;
  selectCandidate: (candidate: TcgScanCandidate) => void;
  resetScan: () => void;
  saveCardImage: (imageBase64: string, cardName: string, game: string, setName?: string | null, cardNumber?: string | null, productId?: string | null) => Promise<string | null>;
  getCardImage: (cardKey: string) => Promise<string | null>;
  generateCardKey: (game: string | null, cardName: string, setName?: string | null, cardNumber?: string | null, productId?: string | null) => string;
}

// Normalize a string for use in card keys
function normalizeForKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Generate a canonical card key
export function generateCardKey(
  game: string | null,
  cardName: string,
  setName?: string | null,
  cardNumber?: string | null,
  productId?: string | null
): string {
  // If we have a stable productId from pricing API, use it as the canonical key
  if (productId) {
    const key = `${normalizeForKey(game || 'unknown')}:pid:${productId}`;
    console.log("[card_key] Using productId-based key:", key);
    return key;
  }

  // Otherwise build a normalized key from card attributes
  const parts = [
    normalizeForKey(game || 'unknown'),
    normalizeForKey(cardName),
    normalizeForKey(setName || ''),
    normalizeForKey(cardNumber || ''),
  ];

  const key = parts.join(':');
  console.log("[card_key] Generated normalized key:", key);
  return key;
}

// Map game types for the save-scan-image function
function mapGameType(game: string | null): string {
  if (!game) return "unknown";

  const gameMap: Record<string, string> = {
    one_piece: "onepiece",
    pokemon: "pokemon",
    dragonball: "dragonball",
    yugioh: "yugioh",
    magic: "mtg",
    lorcana: "lorcana",
    non_game: "non_game",
  };

  return gameMap[game] || game;
}

export function useTcgScan(): UseTcgScanReturn {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<TcgScanResult | null>(null);
  const [candidates, setCandidates] = useState<TcgScanCandidate[]>([]);
  const [remainingScans, setRemainingScans] = useState<number | null>(null);

  // Track if we've already saved the image for this scan
  const imageSavedRef = useRef<boolean>(false);
  const capturedImageRef = useRef<string | null>(null);

  // Get existing card image from storage
  const getCardImage = useCallback(async (cardKey: string): Promise<string | null> => {
    try {
      console.log("[get-card-image] Fetching image for card_key:", cardKey);
      const { data, error } = await supabase.functions.invoke("get-card-image", {
        body: { cardKey },
      });

      if (error) {
        console.error("[get-card-image] Error:", error);
        return null;
      }

      console.log("[get-card-image] Response:", data.exists ? "Found" : "Not found", data.imageUrl || "");
      return data.imageUrl;
    } catch (error) {
      console.error("[get-card-image] Exception:", error);
      return null;
    }
  }, []);

  // Save card image to storage - ALWAYS called when adding to collection
  // This is UNCONDITIONAL - does NOT depend on recognition success or API images
  const saveCardImage = useCallback(async (
    imageBase64: string,
    cardName: string,
    game: string,
    setName?: string | null,
    cardNumber?: string | null,
    productId?: string | null
  ): Promise<string | null> => {
    // Validate we have required data
    if (!cardName) {
      console.error("[save-scan-image] SKIPPED: No cardName provided");
      return null;
    }

    if (!imageBase64) {
      console.warn("[save-scan-image] WARNING: No imageBase64 provided, but proceeding anyway");
    }

    const cardKey = generateCardKey(game, cardName, setName, cardNumber, productId);
    console.log("=== [SAVE-SCAN-IMAGE] CALLING EDGE FUNCTION ===");
    console.log("[save-scan-image] card_key:", cardKey);
    try {
      console.log(">>> [FETCH START] save-scan-image");
      const { data, error } = await supabase.functions.invoke("save-scan-image", {
        body: {
          imageBase64,
          game: mapGameType(game),
          cardName,
          setName: setName || null,
          cardNumber: cardNumber || null,
          productId: productId || null,
        },
      });
      console.log("<<< [FETCH END] save-scan-image");

      if (error) {
        console.error("[save-scan-image] FAILED:", error);
        return null;
      }

      console.log("[save-scan-image] SUCCESS:", data.cached ? "Retrieved from cache" : "Saved new image");
      console.log("[save-scan-image] Returned imageUrl:", data.imageUrl);
      console.log("=== [SAVE-SCAN-IMAGE] COMPLETE ===");
      return data.imageUrl;
    } catch (error) {
      console.error("[save-scan-image] EXCEPTION:", error);
      return null;
    }
  }, []);

  const scanCard = useCallback(async (imageData: string): Promise<TcgScanResult | null> => {
    setIsScanning(true);
    setScanResult(null);
    setCandidates([]);
    imageSavedRef.current = false;
    capturedImageRef.current = imageData;

    try {
      console.log("[tcg-scan] Calling scan endpoint...");
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tcg-scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ image_data: imageData }),
      });

      if (!response.ok) {
        // Check if it's a rate limit error
        if (response.status === 429) {
          toast({
            title: "Rate Limit Reached",
            description: "You've reached the scan limit. Please wait a minute before trying again.",
            variant: "destructive",
          });
          return null;
        }
        throw new Error(`Scan failed: ${response.status}`);
      }

      const result = await response.json() as TcgScanResult;
      console.log("[tcg-scan] Result:", result);

      // Store candidates if any matches found - always show selection grid
      if (result.candidates && result.candidates.length > 0) {
        setCandidates(result.candidates);
      }

      setScanResult(result);

      // Show error toast if scan failed
      if (result.error) {
        toast({
          title: "Scan Issue",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.cardName) {
        toast({
          title: result.source === "cache" ? "Found in Cache!" : "Card Identified!",
          description: `${result.cardName}${result.set ? ` from ${result.set}` : ""}`,
        });
      }

      return result;
    } catch (error) {
      console.error("[tcg-scan] Error:", error);

      const errorMessage = error instanceof Error ? error.message : "Failed to scan card";

      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  const selectCandidate = useCallback((candidate: TcgScanCandidate) => {
    setScanResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cardName: candidate.cardName,
        set: candidate.set,
        number: candidate.number,
        imageUrl: candidate.imageUrl,
        prices: candidate.prices,
        productId: candidate.productId,
      };
    });
    setCandidates([]);
  }, []);

  const resetScan = useCallback(() => {
    setScanResult(null);
    setCandidates([]);
    imageSavedRef.current = false;
    capturedImageRef.current = null;
  }, []);

  return {
    isScanning,
    scanResult,
    candidates,
    remainingScans,
    scanCard,
    selectCandidate,
    resetScan,
    saveCardImage,
    getCardImage,
    generateCardKey,
  };
}
