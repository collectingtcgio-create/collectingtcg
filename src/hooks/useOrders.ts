import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export type OrderStatus = 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

// Manual type since the orders table was just created
interface OrderRow {
  id: string;
  listing_id: string;
  offer_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  shipping_address: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface Order extends OrderRow {
  // Joined data
  listing?: {
    id: string;
    card_name: string;
    image_url: string | null;
    tcg_game: string;
  };
  buyer?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  seller?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useOrders(options?: { 
  role?: 'buyer' | 'seller' | 'all';
  status?: OrderStatus;
}) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { role = 'all', status } = options || {};

  // Fetch orders
  const ordersQuery = useQuery({
    queryKey: ['my-orders', profile?.id, role, status],
    queryFn: async () => {
      if (!profile?.id) return [];

      let query = supabase
        .from('orders' as any)
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by role
      if (role === 'buyer') {
        query = query.eq('buyer_id', profile.id);
      } else if (role === 'seller') {
        query = query.eq('seller_id', profile.id);
      } else {
        query = query.or(`buyer_id.eq.${profile.id},seller_id.eq.${profile.id}`);
      }

      // Filter by status
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      const ordersData = (data as unknown as OrderRow[]) || [];

      // Fetch related data
      const listingIds = [...new Set(ordersData.map(o => o.listing_id))];
      const userIds = new Set<string>();
      ordersData.forEach(o => {
        userIds.add(o.buyer_id);
        userIds.add(o.seller_id);
      });

      const [listingsResult, profilesResult] = await Promise.all([
        supabase
          .from('marketplace_listings')
          .select('id, card_name, image_url, tcg_game')
          .in('id', listingIds),
        supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', Array.from(userIds)),
      ]);

      const listingsMap = new Map(listingsResult.data?.map(l => [l.id, l]) || []);
      const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);

      return ordersData.map(order => ({
        ...order,
        listing: listingsMap.get(order.listing_id),
        buyer: profilesMap.get(order.buyer_id),
        seller: profilesMap.get(order.seller_id),
      })) as Order[];
    },
    enabled: !!profile?.id,
  });

  // Create order (called when offer is accepted)
  const createOrder = useMutation({
    mutationFn: async ({ 
      listingId, 
      offerId, 
      buyerId, 
      sellerId, 
      amount 
    }: { 
      listingId: string; 
      offerId: string; 
      buyerId: string; 
      sellerId: string; 
      amount: number;
    }) => {
      const { data, error } = await supabase
        .from('orders' as any)
        .insert({
          listing_id: listingId,
          offer_id: offerId,
          buyer_id: buyerId,
          seller_id: sellerId,
          amount,
          status: 'pending_payment',
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as OrderRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (error) => {
      console.error('Failed to create order:', error);
    },
  });

  // Update order status
  const updateOrderStatus = useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      trackingNumber,
      shippingAddress,
      notes,
    }: { 
      orderId: string; 
      status: OrderStatus;
      trackingNumber?: string;
      shippingAddress?: string;
      notes?: string;
    }) => {
      const updates: Record<string, any> = { status };
      
      if (trackingNumber !== undefined) updates.tracking_number = trackingNumber;
      if (shippingAddress !== undefined) updates.shipping_address = shippingAddress;
      if (notes !== undefined) updates.notes = notes;
      
      // Set timestamp based on status
      if (status === 'paid') updates.paid_at = new Date().toISOString();
      if (status === 'shipped') updates.shipped_at = new Date().toISOString();
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('orders' as any)
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as OrderRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      
      const statusMessages: Record<OrderStatus, string> = {
        pending_payment: 'Order marked as pending payment',
        paid: 'Order marked as paid',
        shipped: 'Order marked as shipped',
        delivered: 'Order marked as delivered',
        cancelled: 'Order cancelled',
        refunded: 'Order refunded',
      };
      
      toast({ title: statusMessages[data.status as OrderStatus] || 'Order updated' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update order', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  return {
    orders: ordersQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    createOrder,
    updateOrderStatus,
  };
}
