import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Global hook to listen for offer notifications across all listings.
 * Should be mounted in App.tsx or a high-level component.
 */
export function useGlobalOfferNotifications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!profile?.id) return;

    // Listen for new offers where I'm the seller
    const sellerOffersChannel = supabase
      .channel(`global-offers-seller-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'listing_offers',
          filter: `seller_id=eq.${profile.id}`,
        },
        async (payload) => {
          const newOffer = payload.new as any;
          
          // Don't notify if this was created by the current user (seller countering)
          // We check is_counter - if true and seller_id matches, it's the seller countering
          if (newOffer.is_counter) {
            // If it's a counter-offer to the seller (buyer responding to seller's counter)
            // the buyer_id would have created it, so we should notify
            // Actually, counter-offers from buyers should notify sellers
            // Let's fetch the listing name for context
            const { data: listing } = await supabase
              .from('marketplace_listings')
              .select('card_name')
              .eq('id', newOffer.listing_id)
              .single();

            toast({ 
              title: '🔄 Counter-offer response!', 
              description: `Buyer responded with $${newOffer.amount.toFixed(2)} for "${listing?.card_name || 'your listing'}"`,
            });
          } else {
            // New offer from buyer
            const { data: listing } = await supabase
              .from('marketplace_listings')
              .select('card_name')
              .eq('id', newOffer.listing_id)
              .single();

            toast({ 
              title: '💰 New offer received!', 
              description: `Someone offered $${newOffer.amount.toFixed(2)} for "${listing?.card_name || 'your listing'}"`,
            });
          }

          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['listing-offers'] });
          queryClient.invalidateQueries({ queryKey: ['my-offers-count'] });
        }
      )
      .subscribe();

    // Listen for offers where I'm the buyer (status updates)
    const buyerOffersChannel = supabase
      .channel(`global-offers-buyer-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listing_offers',
          filter: `buyer_id=eq.${profile.id}`,
        },
        async (payload) => {
          const updatedOffer = payload.new as any;
          
          const { data: listing } = await supabase
            .from('marketplace_listings')
            .select('card_name')
            .eq('id', updatedOffer.listing_id)
            .single();

          if (updatedOffer.status === 'accepted') {
            toast({ 
              title: '✅ Offer accepted!', 
              description: `Your offer of $${updatedOffer.amount.toFixed(2)} for "${listing?.card_name || 'the item'}" was accepted! Check your orders.`,
            });
          } else if (updatedOffer.status === 'declined') {
            toast({ 
              title: '❌ Offer declined', 
              description: `Your offer of $${updatedOffer.amount.toFixed(2)} for "${listing?.card_name || 'the item'}" was declined`,
              variant: 'destructive',
            });
          } else if (updatedOffer.status === 'countered') {
            toast({ 
              title: '🔄 Counter-offer received!', 
              description: `The seller countered your offer for "${listing?.card_name || 'the item'}"`,
            });
          }

          queryClient.invalidateQueries({ queryKey: ['listing-offers'] });
          queryClient.invalidateQueries({ queryKey: ['my-orders'] });
        }
      )
      .subscribe();

    // Listen for counter-offers where I'm the buyer (new counter from seller)
    const counterOffersChannel = supabase
      .channel(`global-counters-buyer-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'listing_offers',
          filter: `buyer_id=eq.${profile.id}`,
        },
        async (payload) => {
          const newOffer = payload.new as any;
          
          // Only notify for counter-offers from seller
          if (newOffer.is_counter && newOffer.seller_id !== profile.id) {
            const { data: listing } = await supabase
              .from('marketplace_listings')
              .select('card_name')
              .eq('id', newOffer.listing_id)
              .single();

            toast({ 
              title: '🔄 Counter-offer received!', 
              description: `The seller countered with $${newOffer.amount.toFixed(2)} for "${listing?.card_name || 'the item'}"`,
            });

            queryClient.invalidateQueries({ queryKey: ['listing-offers'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sellerOffersChannel);
      supabase.removeChannel(buyerOffersChannel);
      supabase.removeChannel(counterOffersChannel);
    };
  }, [profile?.id, queryClient]);
}
