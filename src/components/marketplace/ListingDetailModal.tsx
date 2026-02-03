import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, User, Calendar, Mail, Trash2, XCircle, Pencil, Save, X, ChevronLeft, ChevronRight, Star } from "lucide-react";
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
  onEdit?: (id: string, data: { card_name?: string; tcg_game?: string; asking_price?: number; condition?: CardCondition; description?: string; image_url?: string }) => void;
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get all images (combine image_url and images array)
  const getAllImages = () => {
    if (!listing) return [];
    const allImages: string[] = [];
    
    // Add images from the images array first
    if (listing.images && listing.images.length > 0) {
      allImages.push(...listing.images);
    }
    
    // If image_url exists and is not already in the array, add it
    if (listing.image_url && !allImages.includes(listing.image_url)) {
      // If it's already the first image in the array, don't add duplicate
      if (allImages.length === 0 || allImages[0] !== listing.image_url) {
        allImages.unshift(listing.image_url);
      }
    }
    
    return allImages;
  };

  const allImages = listing ? getAllImages() : [];
  
  // Reset edit state when listing changes or modal opens
  useEffect(() => {
    if (listing) {
      setEditCardName(listing.card_name);
      setEditTcgGame(listing.tcg_game);
      setEditAskingPrice(listing.asking_price.toString());
      setEditCondition(listing.condition);
      setEditDescription(listing.description || '');
      setCurrentImageIndex(0);
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

  const handleSetMainImage = (imageUrl: string) => {
    if (isOwner && onEdit) {
      onEdit(listing.id, { image_url: imageUrl });
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
  };

  const currentImage = allImages[currentImageIndex] || listing.image_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Listing' : 'Listing Details'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage marketplace listing details
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Card Image with Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-background/50">
              {currentImage ? (
                <img
                  src={currentImage}
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

              {/* Navigation Arrows (only show if multiple images) */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* Image counter */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 text-foreground text-xs px-3 py-1 rounded-full">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                      currentImageIndex === index 
                        ? "border-primary ring-2 ring-primary/50" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <img
                      src={img}
                      alt={`${listing.card_name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Main image indicator */}
                    {img === listing.image_url && (
                      <div className="absolute top-0.5 right-0.5">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Set as Main Image button (owner only) */}
            {isOwner && allImages.length > 1 && currentImage !== listing.image_url && listing.status === 'active' && (
              <Button
                onClick={() => handleSetMainImage(currentImage)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Star className="w-4 h-4 mr-2" />
                Set as Main Image
              </Button>
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
