import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { MarketplaceListing, CardCondition, ListingType, CardRarity } from "@/components/marketplace/types";
import type { Database } from "@/integrations/supabase/types";

type TcgGame = Database['public']['Enums']['tcg_game'];
type DbListingType = Database['public']['Enums']['listing_type'];
type DbCardRarity = Database['public']['Enums']['card_rarity'];

interface CreateListingData {
  card_id?: string;
  card_name: string;
  image_url?: string;
  images?: string[];
  tcg_game: TcgGame;
  asking_price: number;
  condition: CardCondition;
  listing_type?: ListingType;
  rarity?: CardRarity;
  rarity_custom?: string;
  quantity?: number;
  description?: string;
}

interface MarketplaceFilters {
  game?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: CardCondition;
  listingType?: ListingType;
  rarity?: CardRarity;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  myListingsOnly?: boolean;
  searchQuery?: string;
  showSold?: boolean;
}

export function useMarketplaceListings(filters?: MarketplaceFilters) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const listingsQuery = useQuery({
    queryKey: ['marketplace-listings', filters],
    queryFn: async () => {
      // If there's a search query, use the fuzzy search function
      if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
        const { data: searchResults, error: searchError } = await supabase
          .rpc('search_marketplace_listings', {
            search_query: filters.searchQuery.trim(),
            similarity_threshold: 0.2,
          });

        if (searchError) {
          console.error('Fuzzy search error:', searchError);
          // Fall back to regular query if RPC fails
        } else if (searchResults) {
          // Apply additional filters to search results
          let filtered = searchResults as any[];

          if (filters?.showSold) {
            filtered = filtered.filter(item => item.status === 'sold');
          } else if (!filters?.myListingsOnly) {
            filtered = filtered.filter(item => item.status === 'active');
          }

          if (filters?.myListingsOnly && profile?.id) {
            filtered = filtered.filter(item => item.seller_id === profile.id);
          }

          if (filters?.game && filters.game !== 'all') {
            filtered = filtered.filter(item => item.tcg_game === filters.game);
          }

          if (filters?.listingType) {
            filtered = filtered.filter(item => item.listing_type === filters.listingType);
          }

          if (filters?.rarity) {
            filtered = filtered.filter(item => item.rarity === filters.rarity);
          }

          if (filters?.minPrice !== undefined) {
            filtered = filtered.filter(item => item.asking_price >= filters.minPrice!);
          }

          if (filters?.maxPrice !== undefined) {
            filtered = filtered.filter(item => item.asking_price <= filters.maxPrice!);
          }

          if (filters?.condition) {
            filtered = filtered.filter(item => item.condition === filters.condition);
          }

          // Fetch profiles for the filtered results
          const sellerIds = [...new Set(filtered.map(item => item.seller_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', sellerIds);

          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

          return filtered.map(item => ({
            ...item,
            images: item.images || [],
            profiles: profilesMap.get(item.seller_id),
          })) as MarketplaceListing[];
        }
      }

      // Standard query without fuzzy search
      let query = supabase
        .from('marketplace_listings')
        .select('*, profiles(id, username, avatar_url)');

      if (filters?.showSold) {
        query = query.eq('status', 'sold');
      } else if (filters?.myListingsOnly && profile?.id) {
        query = query.eq('seller_id', profile.id);
      } else {
        query = query.eq('status', 'active');
      }

      if (filters?.game && filters.game !== 'all') {
        query = query.eq('tcg_game', filters.game as TcgGame);
      }

      if (filters?.listingType) {
        query = query.eq('listing_type', filters.listingType as DbListingType);
      }

      if (filters?.rarity) {
        query = query.eq('rarity', filters.rarity as DbCardRarity);
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
      
      // Ensure images is always an array
      return (data || []).map(item => ({
        ...item,
        images: item.images || [],
      })) as MarketplaceListing[];
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
        images: data.images || [],
        tcg_game: data.tcg_game,
        asking_price: data.asking_price,
        condition: data.condition,
        listing_type: (data.listing_type || 'single') as DbListingType,
        rarity: (data.rarity || null) as DbCardRarity | null,
        rarity_custom: data.rarity_custom || null,
        quantity: data.quantity || 1,
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
          listing_type: data.listing_type || 'single',
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
    mutationFn: async ({ id, status, sold_price }: { id: string; status: 'active' | 'sold' | 'cancelled'; sold_price?: number }) => {
      const updateData: any = { status };
      
      if (status === 'sold') {
        updateData.sold_at = new Date().toISOString();
        if (sold_price !== undefined) {
          updateData.sold_price = sold_price;
        }
      }

      const { error } = await supabase
        .from('marketplace_listings')
        .update(updateData)
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

  const editListing = useMutation({
    mutationFn: async ({ 
      id, 
      card_name, 
      tcg_game,
      asking_price,
      condition,
      description,
    }: { 
      id: string; 
      card_name?: string; 
      tcg_game?: TcgGame;
      asking_price?: number;
      condition?: CardCondition;
      description?: string;
    }) => {
      const updateData: any = {};
      
      if (card_name !== undefined) updateData.card_name = card_name;
      if (tcg_game !== undefined) updateData.tcg_game = tcg_game;
      if (asking_price !== undefined) updateData.asking_price = asking_price;
      if (condition !== undefined) updateData.condition = condition;
      if (description !== undefined) updateData.description = description;

      const { error } = await supabase
        .from('marketplace_listings')
        .update(updateData)
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
    editListing,
    deleteListing,
  };
}
