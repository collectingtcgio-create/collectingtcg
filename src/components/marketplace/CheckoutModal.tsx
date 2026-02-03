import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  User, 
  CheckCircle2, 
  MessageCircle,
  Package,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: {
    id: string;
    card_name: string;
    image_url: string | null;
    tcg_game: string;
    seller_id: string;
    profiles?: {
      id: string;
      username: string;
      avatar_url: string | null;
    };
  } | null;
  acceptedOffer: {
    id: string;
    amount: number;
    buyer_id: string;
  } | null;
  onProceedToMessages: () => void;
  onViewOrders: () => void;
}

export function CheckoutModal({
  open,
  onOpenChange,
  listing,
  acceptedOffer,
  onProceedToMessages,
  onViewOrders,
}: CheckoutModalProps) {
  if (!listing || !acceptedOffer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            Offer Accepted!
          </DialogTitle>
          <DialogDescription>
            Congratulations! Your offer has been accepted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Order Summary */}
          <div className="bg-background/50 rounded-xl p-4 space-y-3">
            <div className="flex gap-3">
              {listing.image_url ? (
                <img
                  src={listing.image_url}
                  alt={listing.card_name}
                  className="w-16 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-20 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-foreground line-clamp-2">
                  {listing.card_name}
                </h3>
                <Badge variant="outline" className="mt-1 text-xs">
                  {listing.tcg_game.toUpperCase()}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Price */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Agreed Price</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-foreground">
                  {acceptedOffer.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Seller */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Seller</span>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={listing.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    <User className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground">
                  {listing.profiles?.username || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
            <h4 className="font-semibold text-foreground mb-2">Next Steps</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Contact the seller to arrange payment</li>
              <li>Provide your shipping address</li>
              <li>Complete the transaction</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={onProceedToMessages}
              className="flex-1 bg-primary hover:bg-primary/80"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message Seller
            </Button>
            <Button
              onClick={onViewOrders}
              variant="outline"
              className="flex-1"
            >
              <Package className="w-4 h-4 mr-2" />
              View Orders
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
