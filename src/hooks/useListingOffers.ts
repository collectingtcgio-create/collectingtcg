import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { getPurchaseMessage, getNewOfferMessage, getCounterOfferMessage } from "@/lib/systemMessages";

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'cancelled';
export type MessageType = 'text' | 'offer_sent' | 'counter_sent' | 'offer_accepted' | 'offer_declined' | 'offer_expired' | 'buy_now' | 'system';

export interface ListingOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: OfferStatus;
  is_counter: boolean;
  parent_offer_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  buyer_profile?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  seller_profile?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface ListingMessage {
  id: string;
  listing_id: string;
  offer_id: string | null;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: MessageType;
  read_at: string | null;
  created_at: string;
  sender_profile?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useListingOffers(listingId: string | undefined, sellerId: string | undefined) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch offers for this listing
  const offersQuery = useQuery({
    queryKey: ['listing-offers', listingId],
    queryFn: async () => {
      if (!listingId) return [];
      
      const { data, error } = await supabase
        .from('listing_offers')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for buyers and sellers
      const userIds = new Set<string>();
      data?.forEach(offer => {
        userIds.add(offer.buyer_id);
        userIds.add(offer.seller_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(userIds));

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(offer => ({
        ...offer,
        buyer_profile: profilesMap.get(offer.buyer_id),
        seller_profile: profilesMap.get(offer.seller_id),
      })) as ListingOffer[];
    },
    enabled: !!listingId && !!profile?.id,
  });

  // Fetch messages for this listing
  const messagesQuery = useQuery({
    queryKey: ['listing-messages', listingId],
    queryFn: async () => {
      if (!listingId) return [];
      
      const { data, error } = await supabase
        .from('listing_messages')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = new Set<string>();
      data?.forEach(msg => senderIds.add(msg.sender_id));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(senderIds));

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(msg => ({
        ...msg,
        sender_profile: profilesMap.get(msg.sender_id),
      })) as ListingMessage[];
    },
    enabled: !!listingId && !!profile?.id,
  });

  // Real-time subscriptions with offer alerts
  useEffect(() => {
    if (!listingId || !profile?.id) return;

    const offersChannel = supabase
      .channel(`listing-offers-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'listing_offers',
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const newOffer = payload.new as any;
          // Alert if the offer is for the current user (either as buyer or seller)
          if (newOffer.seller_id === profile.id && newOffer.buyer_id !== profile.id) {
            // Seller receives a new offer
            if (newOffer.is_counter) {
              toast({ 
                title: '🔄 Counter-offer response!', 
                description: `Buyer responded with a counter-offer of $${newOffer.amount.toFixed(2)}`,
              });
            } else {
              toast({ 
                title: '💰 New offer received!', 
                description: `Someone made an offer of $${newOffer.amount.toFixed(2)} on your listing`,
              });
            }
          } else if (newOffer.buyer_id === profile.id && newOffer.is_counter) {
            // Buyer receives a counter-offer from seller
            toast({ 
              title: '🔄 Counter-offer received!', 
              description: `The seller countered with $${newOffer.amount.toFixed(2)}`,
            });
          }
          queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listing_offers',
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const updatedOffer = payload.new as any;
          // Alert buyer when their offer is accepted or declined
          if (updatedOffer.buyer_id === profile.id) {
            if (updatedOffer.status === 'accepted') {
              toast({ 
                title: '✅ Offer accepted!', 
                description: `Your offer of $${updatedOffer.amount.toFixed(2)} was accepted!`,
              });
            } else if (updatedOffer.status === 'declined') {
              toast({ 
                title: '❌ Offer declined', 
                description: `Your offer of $${updatedOffer.amount.toFixed(2)} was declined`,
                variant: 'destructive',
              });
            }
          }
          queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel(`listing-messages-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'listing_messages',
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Alert when receiving a new message (not from self)
          if (newMsg.recipient_id === profile.id && newMsg.sender_id !== profile.id) {
            if (newMsg.message_type === 'text') {
              toast({ 
                title: '💬 New message', 
                description: 'You have a new message about this listing',
              });
            }
          }
          queryClient.invalidateQueries({ queryKey: ['listing-messages', listingId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(offersChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [listingId, profile?.id, queryClient]);

  // Send offer
  const sendOffer = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!profile?.id || !listingId || !sellerId) throw new Error('Missing required data');

      // Get listing and buyer info for system message
      const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('card_name')
        .eq('id', listingId)
        .single();

      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', profile.id)
        .single();

      // Create the offer
      const { data: offer, error: offerError } = await supabase
        .from('listing_offers')
        .insert({
          listing_id: listingId,
          buyer_id: profile.id,
          seller_id: sellerId,
          amount,
          status: 'pending',
          is_counter: false,
        })
        .select()
        .single();

      if (offerError) throw offerError;

      // Create listing-specific message
      await supabase.from('listing_messages').insert({
        listing_id: listingId,
        offer_id: offer.id,
        sender_id: profile.id,
        recipient_id: sellerId,
        content: `Offer sent: $${amount.toFixed(2)}`,
        message_type: 'offer_sent',
      });

      // Send system notification to seller (DM from CollectingTCG)
      const systemMessage = getNewOfferMessage(
        listing?.card_name || 'your item',
        amount,
        buyerProfile?.username || 'a buyer'
      );
      
      await supabase.from('messages').insert({
        sender_id: profile.id,
        recipient_id: sellerId,
        content: `[SYSTEM] ${systemMessage}`,
      });

      return offer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-messages', listingId] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({ title: 'Offer sent!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to send offer', description: error.message, variant: 'destructive' });
    },
  });

  // Accept offer
  const acceptOffer = useMutation({
    mutationFn: async ({ offerId, buyerId, amount }: { offerId: string; buyerId: string; amount?: number }) => {
      if (!profile?.id || !listingId || !sellerId) throw new Error('Missing required data');

      // Get the offer to get the amount
      const { data: offerData, error: offerFetchError } = await supabase
        .from('listing_offers')
        .select('amount')
        .eq('id', offerId)
        .single();

      if (offerFetchError) throw offerFetchError;
      const offerAmount = amount ?? offerData.amount;

      // Get listing and buyer info for system message
      const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('card_name')
        .eq('id', listingId)
        .single();

      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', buyerId)
        .single();

      // Update the offer
      const { error: offerError } = await supabase
        .from('listing_offers')
        .update({ status: 'accepted' })
        .eq('id', offerId);

      if (offerError) throw offerError;

      // Create an order
      const { error: orderError } = await supabase
        .from('orders' as any)
        .insert({
          listing_id: listingId,
          offer_id: offerId,
          buyer_id: buyerId,
          seller_id: sellerId,
          amount: offerAmount,
          status: 'pending_payment',
        });

      if (orderError) {
        console.error('Failed to create order:', orderError);
        // Don't throw - order creation is secondary
      }

      // Update listing status to sold
      await supabase
        .from('marketplace_listings')
        .update({ 
          status: 'sold', 
          sold_price: offerAmount,
          sold_at: new Date().toISOString(),
        })
        .eq('id', listingId);

      // Create system message for offer accepted
      await supabase.from('listing_messages').insert({
        listing_id: listingId,
        offer_id: offerId,
        sender_id: profile.id,
        recipient_id: buyerId,
        content: 'Offer accepted!',
        message_type: 'offer_accepted',
      });

      // Send system notification to seller (DM from CollectingTCG)
      const systemMessage = getPurchaseMessage(
        listing?.card_name || 'your item',
        offerAmount,
        buyerProfile?.username || 'a buyer'
      );
      
      // Insert system message into messages table (seller receives)
      await supabase.from('messages').insert({
        sender_id: buyerId, // Use buyer as sender for RLS, but mark as system
        recipient_id: sellerId,
        content: `[SYSTEM] ${systemMessage}`,
      });

      return { offerId, buyerId, amount: offerAmount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-messages', listingId] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({ title: 'Offer accepted! Order created.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to accept offer', description: error.message, variant: 'destructive' });
    },
  });

  // Decline offer
  const declineOffer = useMutation({
    mutationFn: async ({ offerId, buyerId }: { offerId: string; buyerId: string }) => {
      if (!profile?.id || !listingId) throw new Error('Missing required data');

      // Update the offer
      const { error: offerError } = await supabase
        .from('listing_offers')
        .update({ status: 'declined' })
        .eq('id', offerId);

      if (offerError) throw offerError;

      // Create system message
      await supabase.from('listing_messages').insert({
        listing_id: listingId,
        offer_id: offerId,
        sender_id: profile.id,
        recipient_id: buyerId,
        content: 'Offer declined',
        message_type: 'offer_declined',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-messages', listingId] });
      toast({ title: 'Offer declined' });
    },
    onError: (error) => {
      toast({ title: 'Failed to decline offer', description: error.message, variant: 'destructive' });
    },
  });

  // Counter offer - seller sends a counter to the buyer
  const counterOffer = useMutation({
    mutationFn: async ({ offerId, buyerId, amount }: { offerId: string; buyerId: string; amount: number }) => {
      if (!profile?.id || !listingId || !sellerId) throw new Error('Missing required data');

      // Get listing info for system message
      const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('card_name')
        .eq('id', listingId)
        .single();

      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', buyerId)
        .single();

      // Mark old offer as countered
      const { error: updateError } = await supabase
        .from('listing_offers')
        .update({ status: 'countered' })
        .eq('id', offerId);

      if (updateError) throw updateError;

      // Create new counter offer - keep original buyer/seller relationship
      // The seller (profile.id) is countering, so buyer stays as buyerId, seller stays as sellerId
      const { data: counter, error: counterError } = await supabase
        .from('listing_offers')
        .insert({
          listing_id: listingId,
          buyer_id: buyerId,
          seller_id: sellerId,
          amount,
          status: 'pending',
          is_counter: true,
          parent_offer_id: offerId,
        })
        .select()
        .single();

      if (counterError) throw counterError;

      // Create system message for listing
      const { error: msgError } = await supabase.from('listing_messages').insert({
        listing_id: listingId,
        offer_id: counter.id,
        sender_id: profile.id,
        recipient_id: buyerId,
        content: `Counter-offer sent: $${amount.toFixed(2)}`,
        message_type: 'counter_sent',
      });

      if (msgError) console.error('Failed to create counter message:', msgError);

      // Send system notification to seller about counter-offer made (DM)
      const systemMessage = getCounterOfferMessage(
        listing?.card_name || 'the item',
        amount,
        buyerProfile?.username || 'buyer'
      );
      
      await supabase.from('messages').insert({
        sender_id: buyerId,
        recipient_id: sellerId,
        content: `[SYSTEM] Counter-offer of $${amount.toFixed(2)} sent for "${listing?.card_name || 'your listing'}".`,
      });

      return counter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-messages', listingId] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({ title: 'Counter-offer sent!' });
    },
    onError: (error) => {
      console.error('Counter offer error:', error);
      toast({ title: 'Failed to send counter-offer', description: error.message, variant: 'destructive' });
    },
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async ({ content, recipientId }: { content: string; recipientId: string }) => {
      if (!profile?.id || !listingId) throw new Error('Missing required data');

      const { error } = await supabase.from('listing_messages').insert({
        listing_id: listingId,
        sender_id: profile.id,
        recipient_id: recipientId,
        content,
        message_type: 'text',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-messages', listingId] });
    },
    onError: (error) => {
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    },
  });

  // Buy Now (create accepted offer immediately)
  const buyNow = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!profile?.id || !listingId || !sellerId) throw new Error('Missing required data');

      // Create an accepted offer
      const { data: offer, error: offerError } = await supabase
        .from('listing_offers')
        .insert({
          listing_id: listingId,
          buyer_id: profile.id,
          seller_id: sellerId,
          amount,
          status: 'accepted',
          is_counter: false,
        })
        .select()
        .single();

      if (offerError) throw offerError;

      // Create system message
      await supabase.from('listing_messages').insert({
        listing_id: listingId,
        offer_id: offer.id,
        sender_id: profile.id,
        recipient_id: sellerId,
        content: `Bought at asking price: $${amount.toFixed(2)}`,
        message_type: 'buy_now',
      });

      return offer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-messages', listingId] });
      toast({ title: 'Purchase initiated! Contact the seller to arrange payment.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to buy', description: error.message, variant: 'destructive' });
    },
  });

  // Block user from this listing's chat
  const blockUser = useMutation({
    mutationFn: async ({ blockedUserId }: { blockedUserId: string }) => {
      if (!profile?.id) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: profile.id,
          blocked_id: blockedUserId,
        });

      if (error) {
        // Check if already blocked
        if (error.code === '23505') {
          throw new Error('User is already blocked');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'User blocked', description: 'They can no longer message you' });
    },
    onError: (error) => {
      toast({ title: 'Failed to block user', description: error.message, variant: 'destructive' });
    },
  });

  // Unblock user
  const unblockUser = useMutation({
    mutationFn: async ({ blockedUserId }: { blockedUserId: string }) => {
      if (!profile?.id) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', profile.id)
        .eq('blocked_id', blockedUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'User unblocked' });
    },
    onError: (error) => {
      toast({ title: 'Failed to unblock user', description: error.message, variant: 'destructive' });
    },
  });

  // Check if a user is blocked
  const checkBlockedQuery = useQuery({
    queryKey: ['blocked-check', profile?.id, sellerId],
    queryFn: async () => {
      if (!profile?.id) return { isBlocked: false, hasBlocked: false };
      
      // Check if current user has blocked the other party or vice versa
      const otherPartyId = sellerId;
      if (!otherPartyId) return { isBlocked: false, hasBlocked: false };

      const { data: blockedBy } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', otherPartyId)
        .eq('blocked_id', profile.id)
        .maybeSingle();

      const { data: hasBlocked } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', profile.id)
        .eq('blocked_id', otherPartyId)
        .maybeSingle();

      return {
        isBlocked: !!blockedBy,
        hasBlocked: !!hasBlocked,
      };
    },
    enabled: !!profile?.id && !!sellerId,
  });

  // Get active offer for current user
  const myActiveOffer = offersQuery.data?.find(
    offer => offer.buyer_id === profile?.id && offer.status === 'pending'
  );

  // Get pending offers for seller
  const pendingOffers = offersQuery.data?.filter(offer => offer.status === 'pending') || [];

  return {
    offers: offersQuery.data ?? [],
    messages: messagesQuery.data ?? [],
    isLoading: offersQuery.isLoading || messagesQuery.isLoading,
    myActiveOffer,
    pendingOffers,
    sendOffer,
    acceptOffer,
    declineOffer,
    counterOffer,
    sendMessage,
    buyNow,
    blockUser,
    unblockUser,
    isBlocked: checkBlockedQuery.data?.isBlocked ?? false,
    hasBlockedOther: checkBlockedQuery.data?.hasBlocked ?? false,
  };
}
