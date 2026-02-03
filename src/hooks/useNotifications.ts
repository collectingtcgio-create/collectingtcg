import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export interface Notification {
  id: string;
  type: 'purchase' | 'offer' | 'counter_offer' | 'offer_accepted' | 'offer_declined' | 'friend_request';
  title: string;
  message: string;
  listingId?: string;
  friendshipId?: string;
  createdAt: Date;
  read: boolean;
}

/**
 * Hook to manage in-app notifications for marketplace activity
 */
export function useNotifications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear a notification
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!profile?.id) return;

    // Listen for accepted offers where I'm the seller (item sold)
    const soldChannel = supabase
      .channel(`notifications-sold-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listing_offers',
          filter: `seller_id=eq.${profile.id}`,
        },
        async (payload) => {
          const offer = payload.new as any;
          
          if (offer.status === 'accepted') {
            const { data: listing } = await supabase
              .from('marketplace_listings')
              .select('card_name')
              .eq('id', offer.listing_id)
              .single();

            addNotification({
              type: 'purchase',
              title: '🎉 Item Sold!',
              message: `"${listing?.card_name || 'Your item'}" sold for $${offer.amount.toFixed(2)}`,
              listingId: offer.listing_id,
            });
          }
        }
      )
      .subscribe();

    // Listen for new offers to seller
    const offersChannel = supabase
      .channel(`notifications-offers-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'listing_offers',
          filter: `seller_id=eq.${profile.id}`,
        },
        async (payload) => {
          const offer = payload.new as any;
          
          const { data: listing } = await supabase
            .from('marketplace_listings')
            .select('card_name')
            .eq('id', offer.listing_id)
            .single();

          if (offer.is_counter) {
            addNotification({
              type: 'counter_offer',
              title: '🔄 Counter-offer Response',
              message: `Buyer responded with $${offer.amount.toFixed(2)} for "${listing?.card_name || 'your listing'}"`,
              listingId: offer.listing_id,
            });
          } else {
            addNotification({
              type: 'offer',
              title: '💰 New Offer!',
              message: `New offer of $${offer.amount.toFixed(2)} for "${listing?.card_name || 'your listing'}"`,
              listingId: offer.listing_id,
            });
          }
        }
      )
      .subscribe();

    // Listen for offer status changes where I'm the buyer
    const buyerChannel = supabase
      .channel(`notifications-buyer-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listing_offers',
          filter: `buyer_id=eq.${profile.id}`,
        },
        async (payload) => {
          const offer = payload.new as any;
          
          const { data: listing } = await supabase
            .from('marketplace_listings')
            .select('card_name')
            .eq('id', offer.listing_id)
            .single();

          if (offer.status === 'accepted') {
            addNotification({
              type: 'offer_accepted',
              title: '✅ Offer Accepted!',
              message: `Your offer for "${listing?.card_name || 'the item'}" was accepted!`,
              listingId: offer.listing_id,
            });
          } else if (offer.status === 'declined') {
            addNotification({
              type: 'offer_declined',
              title: '❌ Offer Declined',
              message: `Your offer for "${listing?.card_name || 'the item'}" was declined`,
              listingId: offer.listing_id,
            });
          }
        }
      )
      .subscribe();

    // Listen for counter-offers from sellers where I'm the buyer
    const counterChannel = supabase
      .channel(`notifications-counter-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'listing_offers',
          filter: `buyer_id=eq.${profile.id}`,
        },
        async (payload) => {
          const offer = payload.new as any;
          
          if (offer.is_counter && offer.seller_id !== profile.id) {
            const { data: listing } = await supabase
              .from('marketplace_listings')
              .select('card_name')
              .eq('id', offer.listing_id)
              .single();

            addNotification({
              type: 'counter_offer',
              title: '🔄 Counter-offer!',
              message: `Seller countered with $${offer.amount.toFixed(2)} for "${listing?.card_name || 'the item'}"`,
              listingId: offer.listing_id,
            });
          }
        }
      )
      .subscribe();

    // Listen for friend requests where I'm the addressee
    const friendRequestChannel = supabase
      .channel(`notifications-friend-requests-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${profile.id}`,
        },
        async (payload) => {
          const friendship = payload.new as any;
          
          if (friendship.status === 'pending') {
            // Fetch the requester's profile
            const { data: requester } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', friendship.requester_id)
              .single();

            addNotification({
              type: 'friend_request',
              title: '👋 New Friend Request!',
              message: `${requester?.username || 'Someone'} wants to be friends with you`,
              friendshipId: friendship.id,
            });

            // Invalidate friendships query to refresh pending requests
            queryClient.invalidateQueries({ queryKey: ['friendships'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(soldChannel);
      supabase.removeChannel(offersChannel);
      supabase.removeChannel(buyerChannel);
      supabase.removeChannel(counterChannel);
      supabase.removeChannel(friendRequestChannel);
    };
  }, [profile?.id, addNotification, queryClient]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  };
}
