import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, CreditCard } from "lucide-react";

interface UserCard {
  id: string;
  card_name: string;
  image_url: string | null;
  price_estimate: number | null;
}

interface UserCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
}

export function UserCollectionModal({
  open,
  onOpenChange,
  userId,
  username,
}: UserCollectionModalProps) {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && userId) {
      fetchCards();
    }
  }, [open, userId]);

  const fetchCards = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_cards")
      .select("id, card_name, image_url, price_estimate")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setCards(data);
    }
    setLoading(false);
  };

  const filteredCards = cards.filter((c) =>
    c.card_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {username}'s Collection
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {cards.length === 0
                ? `${username} hasn't added any cards yet`
                : "No cards match your search"}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="aspect-[2.5/3.5] rounded-lg bg-muted/50 border border-border/50 overflow-hidden hover:neon-border-cyan transition-all"
                >
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.card_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <CreditCard className="w-8 h-8 text-muted-foreground mb-1" />
                      <span className="text-[10px] text-center text-muted-foreground line-clamp-2">
                        {card.card_name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <p className="text-center text-sm text-muted-foreground">
          {cards.length} cards in collection
        </p>
      </DialogContent>
    </Dialog>
  );
}
