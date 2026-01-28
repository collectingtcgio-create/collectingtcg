import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, User, Calendar, Mail, Trash2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import type { MarketplaceListing } from "./types";
import { conditionLabels, conditionColors, gameColors } from "./types";

interface ListingDetailModalProps {
  listing: MarketplaceListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkSold?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ListingDetailModal({
  listing,
  open,
  onOpenChange,
  onMarkSold,
  onCancel,
  onDelete,
}: ListingDetailModalProps) {
  const { profile } = useAuth();
  
  if (!listing) return null;

  const isOwner = profile?.id === listing.seller_id;
  const gameColor = gameColors[listing.tcg_game] || 'bg-muted text-muted-foreground';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Listing Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Card Image */}
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-background/50">
            {listing.image_url ? (
              <img
                src={listing.image_url}
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
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <Badge className={cn("border mb-2", gameColor)} variant="outline">
                {listing.tcg_game.toUpperCase()}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
