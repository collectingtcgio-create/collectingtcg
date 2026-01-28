import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { MarketplaceListing, CardCondition } from "@/components/marketplace/types";
import type { Database } from "@/integrations/supabase/types";

type TcgGame = Database['public']['Enums']['tcg_game'];

interface CreateListingData {
  card_id?: string;
  card_name: string;
  image_url?: string;
  tcg_game: TcgGame;
  asking_price: number;
  condition: CardCondition;
  description?: string;
}

export function useMarketplaceListings(filters?: {
  game?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: CardCondition;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  myListingsOnly?: boolean;
}) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const listingsQuery = useQuery({
    queryKey: ['marketplace-listings', filters],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_listings')
        .select('*, profiles(id, username, avatar_url)');

      if (filters?.myListingsOnly && profile?.id) {
        query = query.eq('seller_id', profile.id);
      } else {
        query = query.eq('status', 'active');
      }

      if (filters?.game && filters.game !== 'all') {
        query = query.eq('tcg_game', filters.game as TcgGame);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('asking_price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('asking_price', filters.maxPrice);
      }

      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'price_asc':
          query = query.order('asking_price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('asking_price', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MarketplaceListing[];
    },
  });

  const createListing = useMutation({
    mutationFn: async (data: CreateListingData) => {
      if (!profile?.id) throw new Error('Must be logged in to create a listing');

      const { error } = await supabase.from('marketplace_listings').insert({
        seller_id: profile.id,
        card_id: data.card_id || null,
        card_name: data.card_name,
        image_url: data.image_url || null,
        tcg_game: data.tcg_game,
        asking_price: data.asking_price,
        condition: data.condition,
        description: data.description || null,
        status: 'active' as const,
      });

      if (error) throw error;

      // Create activity feed entry
      await supabase.from('activity_feed').insert({
        user_id: profile.id,
        activity_type: 'listing',
        description: `Listed "${data.card_name}" for sale at $${data.asking_price.toFixed(2)}`,
        metadata: {
          card_name: data.card_name,
          asking_price: data.asking_price,
          tcg_game: data.tcg_game,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      toast({ title: 'Listing created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create listing', description: error.message, variant: 'destructive' });
    },
  });

  const updateListing = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'sold' | 'cancelled' }) => {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      toast({ title: 'Listing updated successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update listing', description: error.message, variant: 'destructive' });
    },
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      toast({ title: 'Listing deleted successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete listing', description: error.message, variant: 'destructive' });
    },
  });

  return {
    listings: listingsQuery.data ?? [],
    isLoading: listingsQuery.isLoading,
    error: listingsQuery.error,
    createListing,
    updateListing,
    deleteListing,
  };
}
