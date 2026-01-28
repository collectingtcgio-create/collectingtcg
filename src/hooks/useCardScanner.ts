import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { CardResult, TcgGame } from "@/components/scanner/ScanResultModal";

interface ScanResult {
  success: boolean;
  cards?: CardResult[];
  error?: string;
  processing_time_ms?: number;
}

export function useCardScanner() {
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResults, setScanResults] = useState<CardResult[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showNoCardModal, setShowNoCardModal] = useState(false);
  const [isAddingToBinder, setIsAddingToBinder] = useState(false);

  const identifyCard = useCallback(async (imageData: string): Promise<ScanResult> => {
    setIsProcessing(true);
    setScanResults([]);
    setSelectedCard(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("identify-card", {
        body: {
          image_data: imageData,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to identify card");
      }

      const result = response.data as ScanResult;

      if (result.success && result.cards && result.cards.length > 0) {
        setScanResults(result.cards);
        
        if (result.cards.length === 1) {
          // Single match - show result directly
          setSelectedCard(result.cards[0]);
          setShowResult(true);
        } else {
          // Multiple matches - show selection modal
          setShowSelectionModal(true);
        }
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

  const selectCard = useCallback((card: CardResult) => {
    setSelectedCard(card);
    setShowSelectionModal(false);
    setShowResult(true);
  }, []);

  const addToBinder = useCallback(async (): Promise<boolean> => {
    if (!profile || !selectedCard) {
      toast({
        title: "Cannot add card",
        description: "No card data available or not logged in.",
        variant: "destructive",
      });
      return false;
    }

    setIsAddingToBinder(true);

    try {
      // Insert the card into user_cards with tcg_game
      const { error: insertError } = await supabase.from("user_cards").insert({
        user_id: profile.id,
        card_name: selectedCard.card_name,
        image_url: selectedCard.image_url || null,
        price_estimate: selectedCard.price_estimate || 0,
        tcg_game: selectedCard.tcg_game || null,
      });

      if (insertError) {
        throw insertError;
      }

      // Add to activity feed
      await supabase.from("activity_feed").insert({
        user_id: profile.id,
        activity_type: "scan",
        description: `Scanned and added "${selectedCard.card_name}" to their collection`,
        metadata: {
          card_name: selectedCard.card_name,
          tcg_game: selectedCard.tcg_game,
          set_name: selectedCard.set_name,
          rarity: selectedCard.rarity,
          price_estimate: selectedCard.price_estimate,
        },
      });

      toast({
        title: "Card Added!",
        description: `${selectedCard.card_name} has been added to your binder.`,
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
  }, [profile, selectedCard, toast]);

  const resetScanner = useCallback(() => {
    setScanResults([]);
    setSelectedCard(null);
    setShowResult(false);
    setShowSelectionModal(false);
    setShowNoCardModal(false);
  }, []);

  return {
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
  };
}
