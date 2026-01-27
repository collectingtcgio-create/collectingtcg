import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { CardResult } from "@/components/scanner/ScanResultModal";

interface ScanResult {
  success: boolean;
  card?: CardResult;
  error?: string;
  processing_time_ms?: number;
}

export function useCardScanner() {
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<CardResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showNoCardModal, setShowNoCardModal] = useState(false);
  const [isAddingToBinder, setIsAddingToBinder] = useState(false);

  const identifyCard = useCallback(async (imageData: string): Promise<ScanResult> => {
    setIsProcessing(true);
    setScanResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("identify-card", {
        body: {
          image_data: imageData,
          mode: "simulate", // Change to "identify" when real API is connected
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to identify card");
      }

      const result = response.data as ScanResult;

      if (result.success && result.card) {
        setScanResult(result.card);
        setShowResult(true);
        return result;
      } else {
        setShowNoCardModal(true);
        return result;
      }
    } catch (error) {
      console.error("Card identification error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to identify card";
      
      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const addToBinder = useCallback(async (): Promise<boolean> => {
    if (!profile || !scanResult) {
      toast({
        title: "Cannot add card",
        description: "No card data available or not logged in.",
        variant: "destructive",
      });
      return false;
    }

    setIsAddingToBinder(true);

    try {
      // Insert the card into user_cards
      const { error: insertError } = await supabase.from("user_cards").insert({
        user_id: profile.id,
        card_name: scanResult.card_name,
        image_url: scanResult.image_url || null,
        price_estimate: scanResult.price_estimate || 0,
      });

      if (insertError) {
        throw insertError;
      }

      // Add to activity feed
      await supabase.from("activity_feed").insert({
        user_id: profile.id,
        activity_type: "scan",
        description: `Scanned and added "${scanResult.card_name}" to their collection`,
        metadata: {
          card_name: scanResult.card_name,
          set_name: scanResult.set_name,
          rarity: scanResult.rarity,
          price_estimate: scanResult.price_estimate,
        },
      });

      toast({
        title: "Card Added!",
        description: `${scanResult.card_name} has been added to your binder.`,
      });

      return true;
    } catch (error) {
      console.error("Error adding card to binder:", error);
      
      toast({
        title: "Failed to add card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });

      return false;
    } finally {
      setIsAddingToBinder(false);
    }
  }, [profile, scanResult, toast]);

  const resetScanner = useCallback(() => {
    setScanResult(null);
    setShowResult(false);
    setShowNoCardModal(false);
  }, []);

  return {
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
  };
}
