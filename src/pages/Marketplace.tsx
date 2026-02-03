import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ShoppingBag, Package, Loader2, History, Camera, ClipboardList, User, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMarketplaceListings } from "@/hooks/useMarketplaceListings";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { CreateListingModal } from "@/components/marketplace/CreateListingModal";
import { ListingDetailModal } from "@/components/marketplace/ListingDetailModal";
import { OrdersSection } from "@/components/marketplace/OrdersSection";
import type { MarketplaceListing, CardCondition, ListingType, CardRarity } from "@/components/marketplace/types";
import { Link } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function Marketplace() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sellerIdFromUrl = searchParams.get('seller');
  
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings' | 'orders' | 'sold' | 'seller'>(() => {
    if (sellerIdFromUrl) return 'seller';
    return 'browse';
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch seller profile if viewing seller listings
  const { data: sellerProfile } = useQuery({
    queryKey: ['seller-profile', sellerIdFromUrl],
    queryFn: async () => {
      if (!sellerIdFromUrl) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', sellerIdFromUrl)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sellerIdFromUrl,
  });

  // Update tab when URL params change
  useEffect(() => {
    if (sellerIdFromUrl) {
      setActiveTab('seller');
    }
  }, [sellerIdFromUrl]);

  // Filter state
  const [game, setGame] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState<CardCondition | ''>('');
  const [listingType, setListingType] = useState<ListingType | ''>('');
  const [rarity, setRarity] = useState<CardRarity | ''>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const clearFilters = () => {
    setGame('all');
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    setListingType('');
    setRarity('');
    setSortBy('newest');
    setSearchQuery('');
  };

  const clearSellerFilter = () => {
    searchParams.delete('seller');
    setSearchParams(searchParams);
    setActiveTab('browse');
  };

  const { listings, isLoading, createListing, updateListing, editListing, deleteListing } = useMarketplaceListings({
    game: game !== 'all' ? game : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    condition: condition || undefined,
    listingType: listingType || undefined,
    rarity: rarity || undefined,
    sortBy,
    myListingsOnly: activeTab === 'my-listings',
    showSold: activeTab === 'sold',
    searchQuery: debouncedSearchQuery,
    sellerId: activeTab === 'seller' ? sellerIdFromUrl || undefined : undefined,
  });

  const handleViewDetails = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setDetailModalOpen(true);
  };

  const handleMarkSold = (id: string) => {
    const listing = listings.find(l => l.id === id);
    updateListing.mutate({ 
      id, 
      status: 'sold',
      sold_price: listing?.asking_price,
    });
    setDetailModalOpen(false);
  };

  const handleCancel = (id: string) => {
    updateListing.mutate({ id, status: 'cancelled' });
    setDetailModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteListing.mutate(id);
    setDetailModalOpen(false);
  };

  const handleEdit = (id: string, data: { card_name?: string; tcg_game?: string; asking_price?: number; condition?: CardCondition; description?: string }) => {
    editListing.mutate({ id, ...data } as any);
    // Update local selected listing state for immediate UI feedback
    if (selectedListing) {
      setSelectedListing({
        ...selectedListing,
        card_name: data.card_name ?? selectedListing.card_name,
        tcg_game: data.tcg_game ?? selectedListing.tcg_game,
        asking_price: data.asking_price ?? selectedListing.asking_price,
        condition: data.condition ?? selectedListing.condition,
        description: data.description ?? selectedListing.description,
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-primary" />
              Marketplace
            </h1>
            <p className="text-muted-foreground mt-1">
              Buy and sell trading cards with other collectors
            </p>
          </div>
          {user ? (
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan"
            >
              <Camera className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          ) : (
            <Button asChild className="bg-primary hover:bg-primary/80 text-primary-foreground">
              <Link to="/auth">Sign in to List Cards</Link>
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          if (v !== 'seller') {
            clearSellerFilter();
          }
          setActiveTab(v as any);
        }} className="space-y-6">
          <TabsList className="bg-background/50 border border-border flex-wrap">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Browse All
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="my-listings" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  My Listings
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Orders
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="sold" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Recently Sold
            </TabsTrigger>
            {sellerIdFromUrl && (
              <TabsTrigger value="seller" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {sellerProfile?.username || 'Seller'}'s Listings
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSellerFilter();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Filters - hide for orders tab */}
          {activeTab !== 'orders' && (
            <MarketplaceFilters
              game={game}
              onGameChange={setGame}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              condition={condition}
              onConditionChange={setCondition}
              listingType={listingType}
              onListingTypeChange={setListingType}
              rarity={rarity}
              onRarityChange={setRarity}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onClearFilters={clearFilters}
            />
          )}

          <TabsContent value="browse" className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : listings.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No listings found
                </h3>
                <p className="text-muted-foreground">
                  {debouncedSearchQuery 
                    ? `No results for "${debouncedSearchQuery}". Try a different search.`
                    : game !== 'all' || minPrice || maxPrice || condition || listingType || rarity
                    ? 'Try adjusting your filters'
                    : 'Be the first to list a card!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onViewDetails={handleViewDetails}
                    isOwner={profile?.id === listing.seller_id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-listings" className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : listings.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No listings yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start selling cards from your collection!
                </p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onViewDetails={handleViewDetails}
                    isOwner={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <OrdersSection />
          </TabsContent>

          <TabsContent value="sold" className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : listings.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No sold listings yet
                </h3>
                <p className="text-muted-foreground">
                  Sold cards will appear here for price reference.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onViewDetails={handleViewDetails}
                    showSoldInfo
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Seller Listings Tab */}
          {sellerIdFromUrl && (
            <TabsContent value="seller" className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : listings.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No active listings
                  </h3>
                  <p className="text-muted-foreground">
                    {sellerProfile?.username || 'This seller'} doesn't have any active listings.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onViewDetails={handleViewDetails}
                      isOwner={profile?.id === listing.seller_id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modals */}
      <CreateListingModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={(data) => {
          createListing.mutate(data);
          setCreateModalOpen(false);
        }}
        isSubmitting={createListing.isPending}
      />

      <ListingDetailModal
        listing={selectedListing}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onMarkSold={handleMarkSold}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </Layout>
  );
}
