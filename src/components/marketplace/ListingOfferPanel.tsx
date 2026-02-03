import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Clock,
  ArrowRight,
  ArrowLeft,
  History
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { ListingOffer } from "@/hooks/useListingOffers";

interface ListingOfferPanelProps {
  askingPrice: number;
  acceptsOffers: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
  pendingOffers: ListingOffer[];
  allOffers: ListingOffer[];
  myActiveOffer: ListingOffer | undefined;
  currentUserId: string | undefined;
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

// Helper to get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pending</Badge>;
    case 'accepted':
      return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">Accepted</Badge>;
    case 'declined':
      return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">Declined</Badge>;
    case 'countered':
      return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">Countered</Badge>;
    case 'expired':
      return <Badge variant="outline" className="bg-muted text-muted-foreground border-muted">Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const ListingOfferPanel = forwardRef<HTMLDivElement, ListingOfferPanelProps>(({
  askingPrice,
  acceptsOffers,
  isOwner,
  isLoggedIn,
  pendingOffers,
  allOffers,
  myActiveOffer,
  currentUserId,
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

  // Filter offers relevant to the current user
  const myOffers = allOffers.filter(o => o.buyer_id === currentUserId || o.seller_id === currentUserId);
  
  // Build offer history chains for display (buyer view)
  const getOfferChain = (offers: ListingOffer[]) => {
    // Sort by created_at ascending to show chronological order
    return [...offers].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  // Buyer view
  if (!isOwner) {
    const offerChain = getOfferChain(myOffers);
    const latestOffer = offerChain[offerChain.length - 1];
    const canRespond = latestOffer?.status === 'pending' && latestOffer.is_counter;

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
            <CardContent className="space-y-4">
              {/* Offer History */}
              {offerChain.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <History className="w-3 h-3" />
                    Offer History
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {offerChain.map((offer, index) => {
                      const isMine = offer.buyer_id === currentUserId && !offer.is_counter;
                      const isSellerCounter = offer.is_counter;
                      
                      return (
                        <div 
                          key={offer.id} 
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg text-sm",
                            isMine ? "bg-primary/20 ml-4" : "bg-muted/50 mr-4"
                          )}
                        >
                          {isMine ? (
                            <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                          ) : (
                            <ArrowLeft className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                ${offer.amount.toFixed(2)}
                              </span>
                              {isSellerCounter && (
                                <Badge variant="outline" className="text-[10px] h-4">Counter</Badge>
                              )}
                              {getStatusBadge(offer.status)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {isMine ? 'You' : 'Seller'} • {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Respond to Counter-Offer */}
              {canRespond && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="text-sm font-medium text-foreground">
                    Seller countered with ${latestOffer.amount.toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onAcceptOffer(latestOffer.id, latestOffer.buyer_id, latestOffer.amount)}
                      disabled={isAccepting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                      Accept ${latestOffer.amount.toFixed(2)}
                    </Button>
                    <Button
                      onClick={() => onDeclineOffer(latestOffer.id, latestOffer.buyer_id)}
                      disabled={isDeclining}
                      variant="destructive"
                    >
                      {isDeclining ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground">Or make a new offer:</div>
                </div>
              )}

              {/* New Offer Input */}
              {isLoggedIn ? (
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
                        <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/50">Your Counter</Badge>
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

      {/* All Offer History for Seller */}
      {allOffers.length > 0 && (
        <Card className="bg-background/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Offer History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {getOfferChain(allOffers).map((offer) => {
                const isFromBuyer = !offer.is_counter;
                
                return (
                  <div 
                    key={offer.id} 
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-sm",
                      isFromBuyer ? "bg-muted/50 mr-4" : "bg-primary/20 ml-4"
                    )}
                  >
                    {isFromBuyer ? (
                      <ArrowLeft className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                    <Avatar className="w-5 h-5 flex-shrink-0">
                      <AvatarImage src={offer.buyer_profile?.avatar_url || ''} />
                      <AvatarFallback><User className="w-2 h-2" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">${offer.amount.toFixed(2)}</span>
                        {getStatusBadge(offer.status)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isFromBuyer ? offer.buyer_profile?.username || 'Buyer' : 'You'} • {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

ListingOfferPanel.displayName = 'ListingOfferPanel';
