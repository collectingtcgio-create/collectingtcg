import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  Plus, 
  CreditCard, 
  Loader2,
  DollarSign,
  Trash2,
  Pencil
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditCardModal } from "@/components/collections/EditCardModal";

interface Card {
  id: string;
  card_name: string;
  image_url: string;
  price_estimate: number;
  created_at: string;
  tcg_game?: string | null;
  quantity: number;
}

export default function Collections() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchCards();
    }
  }, [profile]);

  const fetchCards = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (data) {
      setCards(data.map(c => ({ ...c, quantity: c.quantity || 1 })));
      const total = data.reduce((sum, card) => sum + (Number(card.price_estimate) || 0) * (card.quantity || 1), 0);
      setTotalValue(total);
    }
    setLoading(false);
  };

  const handleDelete = async (cardId: string) => {
    const { error } = await supabase
      .from("user_cards")
      .delete()
      .eq("id", cardId);

    if (error) {
      toast({
        title: "Failed to delete card",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setCards((prev) => prev.filter((c) => c.id !== cardId));
    toast({
      title: "Card removed",
      description: "The card has been removed from your collection.",
    });
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setShowEditModal(true);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Collection
            </h1>
            <p className="text-muted-foreground">
              Your digital binder of trading cards
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="font-semibold">{cards.reduce((sum, c) => sum + c.quantity, 0)}</span>
              <span className="text-muted-foreground text-sm">cards</span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-secondary" />
              <span className="font-semibold">${totalValue.toFixed(2)}</span>
              <span className="text-muted-foreground text-sm">value</span>
            </div>

            <Link to="/scanner">
              <Button className="rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300">
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </Link>
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : cards.length === 0 ? (
          <div className="glass-card p-12 text-center neon-border-cyan">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your binder is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start building your collection by scanning cards or adding them manually.
            </p>
            <Link to="/scanner">
              <Button className="rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Card
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="glass-card overflow-hidden group hover:neon-border-cyan transition-all duration-300 fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Card Image */}
                <div className="aspect-[2.5/3.5] bg-muted relative">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.card_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CreditCard className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditCard(card)}
                      className="w-8 h-8 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center hover:bg-primary"
                      title="Edit / Rescan"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="w-8 h-8 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm truncate flex-1">
                      {card.card_name}
                    </h3>
                    {card.quantity > 1 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded">
                        x{card.quantity}
                      </span>
                    )}
                  </div>
                  {card.price_estimate > 0 && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {(Number(card.price_estimate) * card.quantity).toFixed(2)}
                      {card.quantity > 1 && (
                        <span className="text-muted-foreground ml-1">
                          (${Number(card.price_estimate).toFixed(2)} ea)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Card Modal */}
      <EditCardModal
        card={editingCard}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onCardUpdated={fetchCards}
      />
    </Layout>
  );
}