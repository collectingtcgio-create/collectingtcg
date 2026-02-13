import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, CreditCard, ExternalLink, ZoomIn, ChevronLeft, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface UserCard {
  id: string;
  card_name: string;
  image_url: string | null;
  price_estimate: number | null;
  tcg_game?: string | null;
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const handleZoomImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setZoomOpen(true);
  };

  useEffect(() => {
    if (open && userId) {
      fetchCards();
    }
  }, [open, userId]);

  const fetchCards = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_cards")
      .select("id, card_name, image_url, price_estimate, tcg_game")
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

  // Group cards by game
  const groupedCards = filteredCards.reduce((acc, card) => {
    const game = card.tcg_game || "Other";
    if (!acc[game]) acc[game] = [];
    acc[game].push(card);
    return acc;
  }, {} as Record<string, UserCard[]>);

  const folderKeys = Object.keys(groupedCards).sort();
  const displayedCards = currentFolder ? groupedCards[currentFolder] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {username}'s Collection
            </DialogTitle>
            <Link
              to={`/profile/${userId}`}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors w-fit"
              onClick={() => onOpenChange(false)}
            >
              <ExternalLink className="w-3 h-3" />
              View Full Profile
            </Link>
          </div>
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
          ) : !currentFolder ? (
            /* Folders View */
            <div className="grid grid-cols-2 gap-3 pb-4">
              {folderKeys.map((game) => {
                const gameCards = groupedCards[game];
                const previewCard = gameCards[0];
                return (
                  <div
                    key={game}
                    onClick={() => setCurrentFolder(game)}
                    className="group cursor-pointer relative"
                  >
                    <div className="glass-card p-3 hover:neon-border-cyan transition-all duration-300 flex flex-col gap-2 bg-muted/20">
                      <div className="relative aspect-[2.5/3.5] bg-muted/10 rounded-md overflow-hidden flex items-center justify-center">
                        {previewCard?.image_url ? (
                          <img
                            src={previewCard.image_url}
                            alt={game}
                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <FolderOpen className="w-8 h-8 text-muted-foreground/30" />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-background/40 backdrop-blur-[2px]">
                          <FolderOpen className="w-6 h-6 text-primary mb-1" />
                          <h3 className="text-xs font-bold capitalize truncate w-full">
                            {game === 'null' ? 'Other' : game}
                          </h3>
                          <p className="text-[10px] text-muted-foreground">
                            {gameCards.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Folder View Header & Cards */
            <div className="space-y-4 pb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentFolder(null)}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  All
                </Button>
                <div className="h-3 w-px bg-border mx-1" />
                <span className="text-xs font-bold capitalize text-primary flex items-center gap-1">
                  <FolderOpen className="w-3 h-3" />
                  {currentFolder === 'null' ? 'Other' : currentFolder} ({displayedCards.length})
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {displayedCards.map((card) => (
                  <div
                    key={card.id}
                    className="aspect-[2.5/3.5] rounded-lg bg-muted/50 border border-border/50 overflow-hidden hover:neon-border-cyan transition-all"
                  >
                    {card.image_url ? (
                      <div
                        className="w-full h-full cursor-zoom-in group/image relative"
                        onClick={() => handleZoomImage(card.image_url)}
                      >
                        <img
                          src={card.image_url}
                          alt={card.card_name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                      </div>
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
            </div>
          )}
        </ScrollArea>

        <p className="text-center text-sm text-muted-foreground">
          {cards.length} cards in collection
        </p>

        {/* Image Zoom Modal */}
        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl border-primary/30 bg-background/95 backdrop-blur-xl p-1 z-[70]">
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
      </DialogContent>
    </Dialog>
  );
}
