import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const SAVE_SCAN_IMAGE_URL = "https://uvjulnwoacftborhhhnr.supabase.co/functions/v1/save-scan-image";
const GET_CARD_IMAGE_URL = "https://uvjulnwoacftborhhhnr.supabase.co/functions/v1/get-card-image";

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
}

interface SaveImageResponse {
  imageUrl: string;
  title: string;
  cached: boolean;
}

interface UseTcgScanReturn {
  isScanning: boolean;
  scanResult: TcgScanResult | null;
  candidates: TcgScanCandidate[];
  remainingScans: number | null;
  scanCard: (imageData: string) => Promise<TcgScanResult | null>;
  selectCandidate: (candidate: TcgScanCandidate) => void;
  resetScan: () => void;
  saveCardImage: (imageBase64: string, cardName: string, game: string, setName?: string | null, cardNumber?: string | null) => Promise<string | null>;
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

  // Save card image to storage (only called once per scan)
  const saveCardImage = useCallback(async (
    imageBase64: string,
    cardName: string,
    game: string,
    setName?: string | null,
    cardNumber?: string | null
  ): Promise<string | null> => {
    try {
      console.log("Calling save-scan-image at:", SAVE_SCAN_IMAGE_URL);
      const response = await fetch(SAVE_SCAN_IMAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          game: mapGameType(game),
          cardName,
          setName: setName || null,
          cardNumber: cardNumber || null,
        }),
      });

      if (!response.ok) {
        console.error("Failed to save card image:", response.status, response.statusText);
        return null;
      }

      const data = await response.json() as SaveImageResponse;
      console.log(`Image ${data.cached ? "retrieved from cache" : "saved"}: ${data.imageUrl}`);
      return data.imageUrl;
    } catch (error) {
      console.error("Error saving card image:", error);
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
      console.log("Calling tcg-scan...");
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
      console.error("TCG scan error:", error);
      
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
  };
}
