import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  ShoppingCart, 
  HandCoins, 
  Loader2, 
  Check, 
  X, 
  RefreshCw,
  User,
  Clock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { ListingOffer } from "@/hooks/useListingOffers";

interface ListingOfferPanelProps {
  askingPrice: number;
  acceptsOffers: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
  pendingOffers: ListingOffer[];
  myActiveOffer: ListingOffer | undefined;
  onBuyNow: (amount: number) => void;
  onSendOffer: (amount: number) => void;
  onAcceptOffer: (offerId: string, buyerId: string, amount: number) => void;
  onDeclineOffer: (offerId: string, buyerId: string) => void;
  onCounterOffer: (offerId: string, buyerId: string, amount: number) => void;
  isBuying: boolean;
  isSendingOffer: boolean;
  isAccepting: boolean;
  isDeclining: boolean;
  isCountering: boolean;
}

export const ListingOfferPanel = forwardRef<HTMLDivElement, ListingOfferPanelProps>(({
  askingPrice,
  acceptsOffers,
  isOwner,
  isLoggedIn,
  pendingOffers,
  myActiveOffer,
  onBuyNow,
  onSendOffer,
  onAcceptOffer,
  onDeclineOffer,
  onCounterOffer,
  isBuying,
  isSendingOffer,
  isAccepting,
  isDeclining,
  isCountering,
}, ref) => {
  const [offerAmount, setOfferAmount] = useState('');
  const [counterAmounts, setCounterAmounts] = useState<Record<string, string>>({});
  const [showCounterInput, setShowCounterInput] = useState<string | null>(null);

  const handleSendOffer = () => {
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) return;
    onSendOffer(amount);
    setOfferAmount('');
  };

  const handleCounter = (offerId: string, buyerId: string) => {
    const amount = parseFloat(counterAmounts[offerId] || '');
    if (isNaN(amount) || amount <= 0) return;
    onCounterOffer(offerId, buyerId, amount);
    setShowCounterInput(null);
    setCounterAmounts(prev => ({ ...prev, [offerId]: '' }));
  };

  // Buyer view
  if (!isOwner) {
    return (
      <div ref={ref} className="space-y-4">
        {/* Buy Now Section */}
        <Card className="bg-secondary/10 border-secondary/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Buy It Now Price</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-5 h-5 text-secondary" />
                <span className="text-2xl font-bold text-foreground">
                  {askingPrice.toFixed(2)}
                </span>
              </div>
            </div>
            {isLoggedIn && (
              <Button
                onClick={() => onBuyNow(askingPrice)}
                disabled={isBuying}
                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                {isBuying ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                Buy It Now
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Best Offer Section */}
        {acceptsOffers && (
          <Card className="bg-primary/10 border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-primary" />
                Make an Offer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myActiveOffer ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your active offer</span>
                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50">
                      ${myActiveOffer.amount.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Expires {formatDistanceToNow(new Date(myActiveOffer.expires_at), { addSuffix: true })}
                  </div>
                </div>
              ) : isLoggedIn ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        placeholder="Your offer"
                        className="pl-9 bg-background/50"
                      />
                    </div>
                    <Button
                      onClick={handleSendOffer}
                      disabled={isSendingOffer || !offerAmount}
                      className="bg-primary hover:bg-primary/80"
                    >
                      {isSendingOffer ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Send Offer'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Offers expire after 48 hours if not accepted
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Log in to make an offer
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {!isLoggedIn && (
          <p className="text-sm text-center text-muted-foreground">
            Log in to buy or make an offer
          </p>
        )}
      </div>
    );
  }

  // Seller view - show pending offers
  return (
    <div ref={ref} className="space-y-4">
      <Card className="bg-background/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-primary" />
              Pending Offers
            </span>
            {pendingOffers.length > 0 && (
              <Badge variant="secondary">{pendingOffers.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOffers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pending offers yet
            </p>
          ) : (
            <div className="space-y-3">
              {pendingOffers.map((offer) => (
                <div 
                  key={offer.id} 
                  className="bg-background/50 rounded-lg p-3 border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={offer.buyer_profile?.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {offer.buyer_profile?.username || 'Unknown'}
                      </span>
                      {offer.is_counter && (
                        <Badge variant="outline" className="text-xs">Counter</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="font-bold text-foreground">
                        {offer.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <Clock className="w-3 h-3" />
                    Expires {formatDistanceToNow(new Date(offer.expires_at), { addSuffix: true })}
                  </div>

                  {showCounterInput === offer.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={counterAmounts[offer.id] || ''}
                            onChange={(e) => setCounterAmounts(prev => ({ ...prev, [offer.id]: e.target.value }))}
                            placeholder="Counter amount"
                            className="pl-7 h-8 text-sm bg-background/50"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCounter(offer.id, offer.buyer_id)}
                          disabled={isCountering}
                          className="h-8"
                        >
                          {isCountering ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowCounterInput(null)}
                          className="h-8"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onAcceptOffer(offer.id, offer.buyer_id, offer.amount)}
                        disabled={isAccepting}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8"
                      >
                        {isAccepting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCounterInput(offer.id)}
                        className="flex-1 h-8"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Counter
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeclineOffer(offer.id, offer.buyer_id)}
                        disabled={isDeclining}
                        className="h-8"
                      >
                        {isDeclining ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

ListingOfferPanel.displayName = 'ListingOfferPanel';
