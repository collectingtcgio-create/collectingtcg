import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'cancelled';
export type MessageType = 'text' | 'offer_sent' | 'counter_sent' | 'offer_accepted' | 'offer_declined' | 'offer_expired' | 'buy_now';

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

  // Real-time subscriptions
  useEffect(() => {
    if (!listingId || !profile?.id) return;

    const offersChannel = supabase
      .channel(`listing-offers-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listing_offers',
          filter: `listing_id=eq.${listingId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel(`listing-messages-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listing_messages',
          filter: `listing_id=eq.${listingId}`,
        },
        () => {
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

      // Create system message
      await supabase.from('listing_messages').insert({
        listing_id: listingId,
        offer_id: offer.id,
        sender_id: profile.id,
        recipient_id: sellerId,
        content: `Offer sent: $${amount.toFixed(2)}`,
        message_type: 'offer_sent',
      });

      return offer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-messages', listingId] });
      toast({ title: 'Offer sent!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to send offer', description: error.message, variant: 'destructive' });
    },
  });

  // Accept offer
  const acceptOffer = useMutation({
    mutationFn: async ({ offerId, buyerId }: { offerId: string; buyerId: string }) => {
      if (!profile?.id || !listingId) throw new Error('Missing required data');

      // Update the offer
      const { error: offerError } = await supabase
        .from('listing_offers')
        .update({ status: 'accepted' })
        .eq('id', offerId);

      if (offerError) throw offerError;

      // Create system message
      await supabase.from('listing_messages').insert({
        listing_id: listingId,
        offer_id: offerId,
        sender_id: profile.id,
        recipient_id: buyerId,
        content: 'Offer accepted!',
        message_type: 'offer_accepted',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-messages', listingId] });
      toast({ title: 'Offer accepted!' });
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

  // Counter offer
  const counterOffer = useMutation({
    mutationFn: async ({ offerId, buyerId, amount }: { offerId: string; buyerId: string; amount: number }) => {
      if (!profile?.id || !listingId) throw new Error('Missing required data');

      // Mark old offer as countered
      await supabase
        .from('listing_offers')
        .update({ status: 'countered' })
        .eq('id', offerId);

      // Create new counter offer
      const { data: counter, error: counterError } = await supabase
        .from('listing_offers')
        .insert({
          listing_id: listingId,
          buyer_id: buyerId,
          seller_id: profile.id,
          amount,
          status: 'pending',
          is_counter: true,
          parent_offer_id: offerId,
        })
        .select()
        .single();

      if (counterError) throw counterError;

      // Create system message
      await supabase.from('listing_messages').insert({
        listing_id: listingId,
        offer_id: counter.id,
        sender_id: profile.id,
        recipient_id: buyerId,
        content: `Counter-offer sent: $${amount.toFixed(2)}`,
        message_type: 'counter_sent',
      });

      return counter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-offers', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-messages', listingId] });
      toast({ title: 'Counter-offer sent!' });
    },
    onError: (error) => {
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
  };
}
