import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, Eye, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketplaceListing } from "./types";
import { conditionLabels, conditionColors, gameColors } from "./types";

interface ListingCardProps {
  listing: MarketplaceListing;
  onViewDetails: (listing: MarketplaceListing) => void;
}

export function ListingCard({ listing, onViewDetails }: ListingCardProps) {
  const gameColor = gameColors[listing.tcg_game] || 'bg-muted text-muted-foreground';

  return (
    <div className="glass-card rounded-xl overflow-hidden group hover:neon-border-cyan transition-all duration-300">
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
        
        {/* Price Tag */}
        <div className="absolute top-2 right-2 bg-secondary/90 backdrop-blur-sm px-3 py-1.5 rounded-full neon-glow-magenta">
          <span className="flex items-center gap-1 text-secondary-foreground font-bold">
            <DollarSign className="w-4 h-4" />
            {listing.asking_price.toFixed(2)}
          </span>
        </div>

        {/* Game Badge */}
        <Badge 
          className={cn("absolute top-2 left-2 border", gameColor)}
          variant="outline"
        >
          {listing.tcg_game.toUpperCase()}
        </Badge>

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
          className="w-full bg-primary/20 hover:bg-primary/30 text-primary hover:neon-glow-cyan transition-all"
          variant="ghost"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>
    </div>
  );
}
