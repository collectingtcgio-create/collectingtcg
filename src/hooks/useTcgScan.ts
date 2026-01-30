import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  game: "one_piece" | "pokemon" | "dragonball" | null;
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

interface UseTcgScanReturn {
  isScanning: boolean;
  scanResult: TcgScanResult | null;
  candidates: TcgScanCandidate[];
  remainingScans: number | null;
  scanCard: (imageData: string) => Promise<TcgScanResult | null>;
  selectCandidate: (candidate: TcgScanCandidate) => void;
  resetScan: () => void;
}

export function useTcgScan(): UseTcgScanReturn {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<TcgScanResult | null>(null);
  const [candidates, setCandidates] = useState<TcgScanCandidate[]>([]);
  const [remainingScans, setRemainingScans] = useState<number | null>(null);

  const scanCard = useCallback(async (imageData: string): Promise<TcgScanResult | null> => {
    setIsScanning(true);
    setScanResult(null);
    setCandidates([]);

    try {
      const response = await supabase.functions.invoke("tcg-scan", {
        body: { image_data: imageData },
      });

      if (response.error) {
        // Check if it's a rate limit error
        if (response.error.message?.includes("429") || response.error.message?.includes("Rate limit")) {
          toast({
            title: "Rate Limit Reached",
            description: "You've reached the scan limit. Please wait a minute before trying again.",
            variant: "destructive",
          });
          return null;
        }

        throw new Error(response.error.message || "Scan failed");
      }

      const result = response.data as TcgScanResult;

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
  }, []);

  return {
    isScanning,
    scanResult,
    candidates,
    remainingScans,
    scanCard,
    selectCandidate,
    resetScan,
  };
}
