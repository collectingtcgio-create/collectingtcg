import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightLeft, Package, Loader2 } from "lucide-react";

interface CreateTradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientUsername: string;
}

export function CreateTradeModal({
  open,
  onOpenChange,
  recipientId,
  recipientUsername,
}: CreateTradeModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  // Fetch user's cards
  const { data: myCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["my-cards", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("user_cards")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && open,
  });

  const createTrade = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");
      if (selectedCards.length === 0) throw new Error("Select at least one card");

      // Create trade proposal
      const { data: trade, error: tradeError } = await supabase
        .from("trade_proposals")
        .insert({
          proposer_id: profile.id,
          recipient_id: recipientId,
          message: message.trim() || null,
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Add trade items
      const items = selectedCards.map((cardId) => ({
        trade_id: trade.id,
        card_id: cardId,
        owner_id: profile.id,
      }));

      const { error: itemsError } = await supabase
        .from("trade_items")
        .insert(items);

      if (itemsError) throw itemsError;

      return trade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade-proposals"] });
      toast({
        title: "Trade Proposed!",
        description: `Trade offer sent to ${recipientUsername}`,
      });
      setSelectedCards([]);
      setMessage("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create trade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleCard = (cardId: string) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card neon-border-cyan max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-secondary" />
            Trade with {recipientUsername}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card selection */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Select Cards to Offer
            </h4>
            <ScrollArea className="h-[200px] border border-border/50 rounded-lg p-2">
              {cardsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : myCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Package className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No cards in your collection
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myCards.map((card) => (
                    <label
                      key={card.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedCards.includes(card.id)
                          ? 'bg-primary/20 border border-primary/50'
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedCards.includes(card.id)}
                        onCheckedChange={() => toggleCard(card.id)}
                      />
                      {card.image_url && (
                        <img
                          src={card.image_url}
                          alt={card.card_name}
                          className="w-10 h-14 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {card.card_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {card.tcg_game}
                        </p>
                      </div>
                      {card.price_estimate && (
                        <span className="text-sm text-primary font-semibold">
                          ${card.price_estimate}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
            {selectedCards.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCards.length} card(s) selected
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Message (optional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to your trade offer..."
              className="bg-input border-border resize-none"
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={() => createTrade.mutate()}
            disabled={selectedCards.length === 0 || createTrade.isPending}
            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            {createTrade.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-4 h-4 mr-2" />
            )}
            Send Trade Offer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
