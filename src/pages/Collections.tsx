import { useEffect, useState } from "react";
import { Navigate, Link, useParams } from "react-router-dom";
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
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, ZoomIn } from "lucide-react";

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
  const { userId } = useParams();
  const { user, profile: currentProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);

  const handleZoomImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setZoomOpen(true);
  };

  const isOwnCollection = !userId || (user && userId === user.id) || (currentProfile && userId === currentProfile.id);
  const ambientId = userId || user?.id;

  // 1. Fetch the target profile record to get the correct UUID (profiles.id)
  const { data: targetProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-record", ambientId],
    queryFn: async () => {
      if (!ambientId) return null;
      const query = supabase.from("profiles").select("id, username");

      if (userId) {
        // If coming from URL, try ID first, then username/user_id fallback if needed
        query.eq("id", userId);
      } else {
        // If own profile, match on user_id (Auth UID)
        query.eq("user_id", ambientId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!ambientId,
  });

  // 2. Fetch the cards once we have the verified profile UUID
  const { data: cards = [], isLoading: cardsLoading, refetch: refetchCards } = useQuery({
    queryKey: ["user-cards", targetProfile?.id],
    queryFn: async () => {
      if (!targetProfile?.id) return [];
      const { data, error } = await supabase
        .from("user_cards")
        .select("*")
        .eq("user_id", targetProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(c => ({ ...c, quantity: c.quantity || 1 })) as Card[];
    },
    enabled: !!targetProfile?.id,
  });

  const totalValue = cards.reduce((sum, card) => sum + (Number(card.price_estimate) || 0) * (card.quantity || 1), 0);
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);

  const loading = authLoading || profileLoading || cardsLoading;

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

    refetchCards();
    toast({
      title: "Card removed",
      description: "The card has been removed from your collection.",
    });
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setShowEditModal(true);
  };

  if (!user && !userId) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {isOwnCollection ? "My Collection" : `${targetProfile?.username || 'User'}'s Collection`}
              </h1>
              {!isOwnCollection && targetProfile && (
                <Link
                  to={`/profile/${targetProfile.id}`}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors w-fit"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Profile
                </Link>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {isOwnCollection ? "Your digital binder of trading cards" : `Viewing ${targetProfile?.username || 'User'}'s digital binder`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="font-semibold">{totalCards}</span>
              <span className="text-muted-foreground text-sm">cards</span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-secondary" />
              <span className="font-semibold">${totalValue.toFixed(2)}</span>
              <span className="text-muted-foreground text-sm">value</span>
            </div>

            {isOwnCollection && (
              <Link to="/scanner">
                <Button className="rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card
                </Button>
              </Link>
            )}
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
            <h2 className="text-xl font-semibold mb-2">
              {isOwnCollection ? "Your binder is empty" : `${targetProfile?.username || 'This user'}'s binder is empty`}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {isOwnCollection
                ? "Start building your collection by scanning cards or adding them manually."
                : "This collector hasn't added any cards to their digital binder yet."}
            </p>
            {isOwnCollection && (
              <Link to="/scanner">
                <Button className="rounded-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Card
                </Button>
              </Link>
            )}
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
                    <div
                      className="w-full h-full cursor-zoom-in group/image"
                      onClick={() => handleZoomImage(card.image_url)}
                    >
                      <img
                        src={card.image_url}
                        alt={card.card_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CreditCard className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isOwnCollection && (
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditCard(card)}
                        className="w-8 h-8 rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground flex items-center justify-center hover:bg-primary shadow-lg"
                        title="Edit Card"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="w-8 h-8 rounded-full bg-destructive/90 backdrop-blur-sm text-destructive-foreground flex items-center justify-center hover:bg-destructive shadow-lg"
                        title="Delete Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
        onCardUpdated={refetchCards}
      />

      {/* Image Zoom Modal */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl border-primary/30 bg-background/95 backdrop-blur-xl p-1">
          <DialogHeader className="sr-only">
            <DialogTitle>Card Image Zoom</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-auto max-h-[85vh] flex items-center justify-center overflow-hidden rounded-lg">
              <img
                src={selectedImage}
                alt="Card layout zoom"
                className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}