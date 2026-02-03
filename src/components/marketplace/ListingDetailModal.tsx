import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, User, Calendar, Mail, Trash2, XCircle, Pencil, Save, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import type { MarketplaceListing, CardCondition } from "./types";
import { conditionLabels, conditionColors, gameColors, gameLabels } from "./types";

interface ListingDetailModalProps {
  listing: MarketplaceListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkSold?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, data: { card_name?: string; tcg_game?: string; asking_price?: number; condition?: CardCondition; description?: string }) => void;
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
  { value: 'starwars', label: 'Star Wars' },
];

export function ListingDetailModal({
  listing,
  open,
  onOpenChange,
  onMarkSold,
  onCancel,
  onDelete,
  onEdit,
}: ListingDetailModalProps) {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editCardName, setEditCardName] = useState('');
  const [editTcgGame, setEditTcgGame] = useState('');
  const [editAskingPrice, setEditAskingPrice] = useState('');
  const [editCondition, setEditCondition] = useState<CardCondition>('near_mint');
  const [editDescription, setEditDescription] = useState('');
  
  // Reset edit state when listing changes or modal opens
  useEffect(() => {
    if (listing) {
      setEditCardName(listing.card_name);
      setEditTcgGame(listing.tcg_game);
      setEditAskingPrice(listing.asking_price.toString());
      setEditCondition(listing.condition);
      setEditDescription(listing.description || '');
    }
    setIsEditing(false);
  }, [listing, open]);
  
  if (!listing) return null;

  const isOwner = profile?.id === listing.seller_id;
  const gameColor = gameColors[listing.tcg_game] || 'bg-muted text-muted-foreground';
  const gameLabel = gameLabels[listing.tcg_game] || listing.tcg_game.toUpperCase();

  const handleSaveEdit = () => {
    const price = parseFloat(editAskingPrice);
    if (isNaN(price) || price <= 0) return;
    
    onEdit?.(listing.id, {
      card_name: editCardName,
      tcg_game: editTcgGame,
      asking_price: price,
      condition: editCondition,
      description: editDescription || undefined,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setEditCardName(listing.card_name);
    setEditTcgGame(listing.tcg_game);
    setEditAskingPrice(listing.asking_price.toString());
    setEditCondition(listing.condition);
    setEditDescription(listing.description || '');
    setIsEditing(false);
  };

  // Get the primary image (first from images array or fallback to image_url)
  const primaryImage = listing.images?.[0] || listing.image_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Listing' : 'Listing Details'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage marketplace listing details
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Card Image */}
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-background/50">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={listing.card_name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            
            {/* Status Badge */}
            {listing.status !== 'active' && (
              <div className={cn(
                "absolute inset-0 flex items-center justify-center bg-background/80",
                listing.status === 'sold' ? 'text-primary' : 'text-muted-foreground'
              )}>
                <span className="text-2xl font-bold uppercase">
                  {listing.status}
                </span>
              </div>
            )}
            
            {/* Multiple images indicator */}
            {listing.images && listing.images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-background/80 text-foreground text-xs px-2 py-1 rounded">
                +{listing.images.length - 1} more
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {isEditing ? (
              // Edit Mode
              <>
                <div className="space-y-2">
                  <Label>Title / Card Name</Label>
                  <Input
                    value={editCardName}
                    onChange={(e) => setEditCardName(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Game / Category</Label>
                  <Select value={editTcgGame} onValueChange={setEditTcgGame}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
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

                <div className="space-y-2">
                  <Label>Asking Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editAskingPrice}
                    onChange={(e) => setEditAskingPrice(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={editCondition} onValueChange={(v) => setEditCondition(v as CardCondition)}>
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

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveEdit} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              // View Mode
              <>
                <div>
                  <Badge className={cn("border mb-2", gameColor)} variant="outline">
                    {gameLabel}
                  </Badge>
                  <h2 className="text-2xl font-bold text-foreground">
                    {listing.card_name}
                  </h2>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 bg-secondary/20 rounded-xl p-4 neon-glow-magenta">
                  <DollarSign className="w-8 h-8 text-secondary" />
                  <span className="text-3xl font-bold text-foreground">
                    {listing.asking_price.toFixed(2)}
                  </span>
                </div>

                {/* Condition */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Condition</span>
                  <Badge 
                    className={cn("border-none", conditionColors[listing.condition])}
                    variant="outline"
                  >
                    {conditionLabels[listing.condition]}
                  </Badge>
                </div>

                {/* Listed Date */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Listed</span>
                  <span className="flex items-center gap-1 text-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(listing.created_at), 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Description */}
                {listing.description && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Description</span>
                    <p className="text-foreground bg-background/30 rounded-lg p-3">
                      {listing.description}
                    </p>
                  </div>
                )}

                {/* Seller Info */}
                <div className="border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground block mb-2">Seller</span>
                  <Link 
                    to={`/profile/${listing.profiles?.id}`}
                    className="flex items-center gap-3 hover:bg-background/30 p-2 rounded-lg transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={listing.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">
                      {listing.profiles?.username || 'Unknown Seller'}
                    </span>
                  </Link>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4">
                  {isOwner ? (
                    <>
                      {listing.status === 'active' && (
                        <>
                          <Button
                            onClick={() => setIsEditing(true)}
                            variant="outline"
                            className="w-full"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Listing
                          </Button>
                          <Button
                            onClick={() => onMarkSold?.(listing.id)}
                            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                          >
                            Mark as Sold
                          </Button>
                          <Button
                            onClick={() => onCancel?.(listing.id)}
                            variant="outline"
                            className="w-full"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Listing
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => onDelete?.(listing.id)}
                        variant="destructive"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Listing
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan"
                      asChild
                    >
                      <Link to={`/profile/${listing.profiles?.id}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Seller
                      </Link>
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
