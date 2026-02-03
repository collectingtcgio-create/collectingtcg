import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, Eye, User, Package, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketplaceListing } from "./types";
import { conditionLabels, conditionColors, gameColors, listingTypeLabels, listingTypeColors } from "./types";
import { format } from "date-fns";

interface ListingCardProps {
  listing: MarketplaceListing;
  onViewDetails: (listing: MarketplaceListing) => void;
  showSoldInfo?: boolean;
}

export function ListingCard({ listing, onViewDetails, showSoldInfo }: ListingCardProps) {
  const gameColor = gameColors[listing.tcg_game] || 'bg-muted text-muted-foreground';
  const typeColor = listingTypeColors[listing.listing_type] || listingTypeColors.single;
  const isSold = listing.status === 'sold';

  return (
    <div className={cn(
      "glass-card rounded-xl overflow-hidden group transition-all duration-300",
      isSold ? "opacity-90" : "hover:neon-border-cyan"
    )}>
      {/* Card Image */}
      <div className="relative aspect-[3/4] bg-background/50 overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.card_name}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-sm">No Image</span>
          </div>
        )}
        
        {/* Sold Overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge className="bg-red-500/90 text-white text-lg px-4 py-2 font-bold">
              SOLD
            </Badge>
          </div>
        )}
        
        {/* Price Tag */}
        <div className={cn(
          "absolute top-2 right-2 backdrop-blur-sm px-3 py-1.5 rounded-full",
          isSold ? "bg-muted/90" : "bg-secondary/90 neon-glow-magenta"
        )}>
          <span className={cn(
            "flex items-center gap-1 font-bold",
            isSold ? "text-muted-foreground" : "text-secondary-foreground"
          )}>
            <DollarSign className="w-4 h-4" />
            {(listing.sold_price || listing.asking_price).toFixed(2)}
          </span>
        </div>

        {/* Game Badge */}
        <Badge 
          className={cn("absolute top-2 left-2 border", gameColor)}
          variant="outline"
        >
          {listing.tcg_game.toUpperCase()}
        </Badge>

        {/* Listing Type Badge (if not single) */}
        {listing.listing_type !== 'single' && (
          <Badge 
            className={cn("absolute top-10 left-2 border", typeColor)}
            variant="outline"
          >
            <Package className="w-3 h-3 mr-1" />
            {listingTypeLabels[listing.listing_type]}
          </Badge>
        )}

        {/* Quantity Badge (if more than 1) */}
        {listing.quantity > 1 && (
          <Badge 
            className="absolute bottom-10 right-2 bg-primary/90 text-primary-foreground"
          >
            ×{listing.quantity}
          </Badge>
        )}

        {/* Condition Badge */}
        <Badge 
          className={cn(
            "absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm",
            conditionColors[listing.condition]
          )}
          variant="outline"
        >
          {conditionLabels[listing.condition]}
        </Badge>
      </div>

      {/* Card Info */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
          {listing.card_name}
        </h3>

        {/* Sold Date (for sold items) */}
        {showSoldInfo && listing.sold_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Sold {format(new Date(listing.sold_at), 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* Seller Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="w-6 h-6">
            <AvatarImage src={listing.profiles?.avatar_url || ''} />
            <AvatarFallback>
              <User className="w-3 h-3" />
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{listing.profiles?.username || 'Unknown Seller'}</span>
        </div>

        {/* View Button */}
        <Button
          onClick={() => onViewDetails(listing)}
          className={cn(
            "w-full transition-all",
            isSold 
              ? "bg-muted hover:bg-muted/80 text-muted-foreground"
              : "bg-primary/20 hover:bg-primary/30 text-primary hover:neon-glow-cyan"
          )}
          variant="ghost"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>
    </div>
  );
}
