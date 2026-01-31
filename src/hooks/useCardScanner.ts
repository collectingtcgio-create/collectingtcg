import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { CardResult, TcgGame } from "@/components/scanner/ScanResultModal";

const SAVE_SCAN_IMAGE_URL = "https://uvjulnwoacftborhhhnr.supabase.co/functions/v1/save-scan-image";

interface ScanResult {
  success: boolean;
  cards?: CardResult[];
  error?: string;
  processing_time_ms?: number;
}

interface SaveImageResponse {
  imageUrl: string;
  title: string;
  cached: boolean;
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
function generateCardKey(
  game: string | null | undefined,
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
function mapGameType(game: TcgGame | undefined): string {
  if (!game) return "unknown";
  
  const gameMap: Record<string, string> = {
    onepiece: "onepiece",
    pokemon: "pokemon",
    dragonball: "dragonball",
    yugioh: "yugioh",
    magic: "mtg",
    lorcana: "lorcana",
    unionarena: "unionarena",
    marvel: "marvel",
  };
  
  return gameMap[game] || game;
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
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);

  // Save card image to storage - ALWAYS called when adding to collection
  const saveCardImage = useCallback(async (
    imageBase64: string,
    cardName: string,
    game: string,
    setName?: string | null,
    cardNumber?: string | null,
    productId?: string | null
  ): Promise<string | null> => {
    const cardKey = generateCardKey(game, cardName, setName, cardNumber, productId);
    console.log("[save-scan-image] Calling with card_key:", cardKey);
    console.log("[save-scan-image] URL:", SAVE_SCAN_IMAGE_URL);
    console.log("[save-scan-image] Payload:", { game, cardName, setName, cardNumber, productId });
    
    try {
      const response = await fetch(SAVE_SCAN_IMAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          game,
          cardName,
          setName: setName || null,
          cardNumber: cardNumber || null,
          productId: productId || null,
        }),
      });

      console.log("[save-scan-image] Response status:", response.status, response.statusText);

      if (!response.ok) {
        console.error("[save-scan-image] Failed:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("[save-scan-image] Error body:", errorText);
        return null;
      }

      const data = await response.json() as SaveImageResponse;
      console.log("[save-scan-image] Success:", data.cached ? "Retrieved from cache" : "Saved new image");
      console.log("[save-scan-image] Returned imageUrl:", data.imageUrl);
      return data.imageUrl;
    } catch (error) {
      console.error("[save-scan-image] Error:", error);
      return null;
    }
  }, []);

  const identifyCard = useCallback(async (imageData: string, gameHint?: string): Promise<ScanResult> => {
    setIsProcessing(true);
    setScanResults([]);
    setSelectedCard(null);
    setCapturedImageData(imageData); // Store captured image

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("identify-card-v3", {
        body: {
          image_data: imageData,
          game_hint: gameHint && gameHint !== 'auto' ? gameHint : undefined,
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

  const addToBinder = useCallback(async (updatedCard?: CardResult): Promise<boolean> => {
    const cardToAdd = updatedCard || selectedCard;
    
    if (!profile || !cardToAdd) {
      toast({
        title: "Cannot add card",
        description: "No card data available or not logged in.",
        variant: "destructive",
      });
      return false;
    }

    setIsAddingToBinder(true);

    try {
      // Map tcg_game to valid database enum
      const dbTcgGame = cardToAdd.tcg_game === 'marvel' ? null : cardToAdd.tcg_game;
      
      // ALWAYS call save-scan-image when adding to collection
      let imageToSave = cardToAdd.image_url;
      
      // Always try to save the captured image to get a permanent URL
      if (capturedImageData && cardToAdd.card_name) {
        console.log("[addToBinder] ALWAYS calling save-scan-image...");
        console.log("[addToBinder] Card:", cardToAdd.card_name);
        console.log("[addToBinder] Game:", cardToAdd.tcg_game);
        console.log("[addToBinder] Set:", cardToAdd.set_name);
        console.log("[addToBinder] Number:", cardToAdd.card_number);
        
        const savedUrl = await saveCardImage(
          capturedImageData,
          cardToAdd.card_name,
          mapGameType(cardToAdd.tcg_game),
          cardToAdd.set_name,
          cardToAdd.card_number,
          null // productId - would come from pricing API if available
        );
        
        if (savedUrl) {
          console.log("[addToBinder] save-scan-image returned imageUrl:", savedUrl);
          imageToSave = savedUrl;
        } else {
          console.log("[addToBinder] save-scan-image returned null, using original image_url");
        }
      } else {
        console.log("[addToBinder] No captured image data, skipping save-scan-image");
        console.log("[addToBinder] capturedImageData exists:", !!capturedImageData);
        console.log("[addToBinder] card_name exists:", !!cardToAdd.card_name);
      }
      
      // Insert the card into user_cards with tcg_game
      const { error: insertError } = await supabase.from("user_cards").insert({
        user_id: profile.id,
        card_name: cardToAdd.card_name,
        image_url: imageToSave || null,
        price_estimate: cardToAdd.price_estimate || cardToAdd.price_market || 0,
        tcg_game: dbTcgGame || null,
      });

      if (insertError) {
        throw insertError;
      }

      // Add to activity feed
      await supabase.from("activity_feed").insert({
        user_id: profile.id,
        activity_type: "scan",
        description: `Scanned and added "${cardToAdd.card_name}" to their collection`,
        metadata: {
          card_name: cardToAdd.card_name,
          tcg_game: cardToAdd.tcg_game,
          set_name: cardToAdd.set_name,
          rarity: cardToAdd.rarity,
          price_estimate: cardToAdd.price_estimate || cardToAdd.price_market,
        },
      });

      toast({
        title: "Card Added!",
        description: `${cardToAdd.card_name} has been added to your binder.`,
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
  }, [profile, selectedCard, toast, capturedImageData, saveCardImage]);

  const resetScanner = useCallback(() => {
    setScanResults([]);
    setSelectedCard(null);
    setShowResult(false);
    setShowSelectionModal(false);
    setShowNoCardModal(false);
    setCapturedImageData(null);
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
