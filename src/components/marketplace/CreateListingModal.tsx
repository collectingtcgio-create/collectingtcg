import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardCondition } from "./types";
import { conditionLabels } from "./types";
import type { Database } from "@/integrations/supabase/types";

type TcgGame = Database['public']['Enums']['tcg_game'];

interface CreateListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    card_id?: string;
    card_name: string;
    image_url?: string;
    tcg_game: TcgGame;
    asking_price: number;
    condition: CardCondition;
    description?: string;
  }) => void;
  isSubmitting?: boolean;
}

const games = [
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'magic', label: 'Magic: The Gathering' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!' },
  { value: 'onepiece', label: 'One Piece' },
  { value: 'lorcana', label: 'Lorcana' },
  { value: 'dragonball', label: 'Dragon Ball' },
  { value: 'unionarena', label: 'Union Arena' },
  { value: 'marvel', label: 'Marvel' },
];

export function CreateListingModal({ open, onOpenChange, onSubmit, isSubmitting }: CreateListingModalProps) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'collection' | 'manual'>('collection');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  
  // Manual entry state
  const [cardName, setCardName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tcgGame, setTcgGame] = useState<TcgGame | ''>('');
  
  // Common fields
  const [askingPrice, setAskingPrice] = useState('');
  const [condition, setCondition] = useState<CardCondition>('near_mint');
  const [description, setDescription] = useState('');

  // Fetch user's cards
  const { data: userCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['user-cards-for-listing', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && open,
  });

  const handleSubmit = () => {
    const price = parseFloat(askingPrice);
    if (isNaN(price) || price <= 0) return;

    if (tab === 'collection' && selectedCard) {
      onSubmit({
        card_id: selectedCard.id,
        card_name: selectedCard.card_name,
        image_url: selectedCard.image_url,
        tcg_game: (selectedCard.tcg_game || 'pokemon') as TcgGame,
        asking_price: price,
        condition,
        description: description || undefined,
      });
    } else if (tab === 'manual' && cardName && tcgGame) {
      onSubmit({
        card_name: cardName,
        image_url: imageUrl || undefined,
        tcg_game: tcgGame,
        asking_price: price,
        condition,
        description: description || undefined,
      });
    }

    // Reset form
    setSelectedCard(null);
    setCardName('');
    setImageUrl('');
    setTcgGame('');
    setAskingPrice('');
    setCondition('near_mint');
    setDescription('');
  };

  const isValid = 
    (tab === 'collection' && selectedCard && askingPrice) ||
    (tab === 'manual' && cardName && tcgGame && askingPrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Create New Listing
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-background/50">
            <TabsTrigger value="collection">From Collection</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-4 mt-4">
            <Label>Select a card from your collection</Label>
            {cardsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : userCards?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No cards in your collection yet.
              </p>
            ) : (
              <ScrollArea className="h-48 rounded-lg border border-border bg-background/30 p-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {userCards?.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className={cn(
                        "relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all",
                        selectedCard?.id === card.id
                          ? "border-primary neon-glow-cyan"
                          : "border-transparent hover:border-primary/50"
                      )}
                    >
                      {card.image_url ? (
                        <img
                          src={card.image_url}
                          alt={card.card_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-center p-1">
                          {card.card_name}
                        </div>
                      )}
                      {selectedCard?.id === card.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
            {selectedCard && (
              <p className="text-sm text-primary">
                Selected: {selectedCard.card_name}
              </p>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Card Name *</Label>
                <Input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Enter card name"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Game *</Label>
                <Select value={tcgGame} onValueChange={(v) => setTcgGame(v as TcgGame)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {games.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="bg-background/50"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Common Fields */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Asking Price ($) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              placeholder="0.00"
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label>Condition *</Label>
            <Select value={condition} onValueChange={(v) => setCondition(v as CardCondition)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {(Object.keys(conditionLabels) as CardCondition[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {conditionLabels[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any additional details about the card..."
            className="bg-background/50 min-h-[80px]"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="bg-primary hover:bg-primary/80 text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Listing
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
