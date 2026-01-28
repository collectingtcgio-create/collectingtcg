import { useState, useCallback } from "react";
import { Search, Loader2, X, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CardResult, TcgGame, TCG_GAME_LABELS } from "./ScanResultModal";
import { GameSelector } from "./GameSelector";

interface CardNameSearchProps {
  onCardSelect: (card: CardResult) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardNameSearch({ onCardSelect, open, onOpenChange }: CardNameSearchProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<TcgGame | 'auto'>('auto');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CardResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a card name",
        description: "Please type a card name to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]);

    try {
      const response = await supabase.functions.invoke("identify-card-v3", {
        body: {
          search_query: searchQuery.trim(),
          game_hint: selectedGame !== 'auto' ? selectedGame : undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Search failed");
      }

      const result = response.data;
      if (result.success && result.cards && result.cards.length > 0) {
        setSearchResults(result.cards);
      } else {
        toast({
          title: "No cards found",
          description: "Try a different card name or check the spelling",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedGame, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectCard = (card: CardResult) => {
    onCardSelect(card);
    onOpenChange(false);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-lg mx-auto max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Search Cards by Name
          </DialogTitle>
          <DialogDescription>
            Type a card name to find matching cards with images and prices
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Game Selector */}
          <GameSelector 
            value={selectedGame}
            onChange={setSelectedGame}
            disabled={isSearching}
          />

          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Charizard VMAX, Black Lotus..."
              className="bg-input border-border flex-1"
              disabled={isSearching}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-primary hover:bg-primary/80"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Searching...</span>
              </div>
            )}

            {!isSearching && hasSearched && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No cards found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try a different name or check the game filter</p>
              </div>
            )}

            {searchResults.map((card, index) => (
              <button
                key={card.id || index}
                onClick={() => handleSelectCard(card)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card border border-border/50 hover:border-primary/50 transition-all text-left"
              >
                {/* Card Thumbnail */}
                <div className="w-14 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.card_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{card.card_name}</h4>
                  {card.set_name && (
                    <p className="text-xs text-muted-foreground truncate">{card.set_name}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {card.tcg_game && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {TCG_GAME_LABELS[card.tcg_game]}
                      </Badge>
                    )}
                    {card.rarity && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/20">
                        {card.rarity}
                      </Badge>
                    )}
                    {card.card_number && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        #{card.card_number}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Price */}
                {(card.price_market || card.price_estimate) && (
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-secondary text-sm">
                      {formatPrice(card.price_market || card.price_estimate)}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
