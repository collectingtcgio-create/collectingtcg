import { useEffect, useState } from "react";
import { TrendingUp, Trophy, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TrendingCard {
  id: string;
  card_name: string;
  image_url: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
}

interface TopCollector {
  username: string;
  avatar_url: string | null;
  card_count: number;
  user_id: string;
}

interface MarketplaceDeal {
  id: string;
  card_name: string;
  image_url: string | null;
  images: string[] | null;
  asking_price: number;
  seller_username: string;
  rarity: string | null;
  created_at: string;
}

export function TrendingSection() {
  const [trendingCards, setTrendingCards] = useState<TrendingCard[]>([]);
  const [topCollectors, setTopCollectors] = useState<TopCollector[]>([]);
  const [marketplaceDeals, setMarketplaceDeals] = useState<MarketplaceDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingData();

    // Set up real-time subscriptions
    const userCardsChannel = supabase
      .channel('user_cards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_cards'
        },
        () => {
          // Refetch trending cards and top collectors when user_cards changes
          fetchTrendingData();
        }
      )
      .subscribe();

    const marketplaceChannel = supabase
      .channel('marketplace_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_listings'
        },
        () => {
          // Refetch marketplace deals when listings change
          fetchTrendingData();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(userCardsChannel);
      supabase.removeChannel(marketplaceChannel);
    };
  }, []);

  async function fetchTrendingData() {
    try {
      // Fetch trending pulls (recent cards with images)
      const { data: cardsData } = await supabase
        .from("user_cards")
        .select(`
          id,
          card_name,
          image_url,
          created_at,
          user_id,
          profiles!inner(username, avatar_url)
        `)
        .not("image_url", "is", null)
        .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (cardsData) {
        const formatted = cardsData.map((card: any) => ({
          id: card.id,
          card_name: card.card_name,
          image_url: card.image_url,
          created_at: card.created_at,
          username: card.profiles.username,
          avatar_url: card.profiles.avatar_url,
        }));
        setTrendingCards(formatted);
      }

      // Fetch top collectors
      const { data: collectorsData } = await supabase
        .from("user_cards")
        .select(`
          user_id,
          profiles!inner(username, avatar_url)
        `);

      if (collectorsData) {
        // Group by user and count cards
        const userCounts = collectorsData.reduce((acc: any, card: any) => {
          const userId = card.user_id;
          if (!acc[userId]) {
            acc[userId] = {
              user_id: userId,
              username: card.profiles.username,
              avatar_url: card.profiles.avatar_url,
              card_count: 0,
            };
          }
          acc[userId].card_count++;
          return acc;
        }, {});

        const sorted = Object.values(userCounts)
          .sort((a: any, b: any) => b.card_count - a.card_count)
          .slice(0, 5);

        setTopCollectors(sorted as TopCollector[]);
      }

      // Fetch marketplace deals
      const { data: dealsData } = await supabase
        .from("marketplace_listings")
        .select(`
          id,
          card_name,
          image_url,
          images,
          asking_price,
          rarity,
          created_at,
          seller_id,
          profiles!inner(username)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);

      if (dealsData) {
        const formatted = dealsData.map((deal: any) => ({
          id: deal.id,
          card_name: deal.card_name,
          image_url: deal.image_url,
          images: deal.images,
          asking_price: deal.asking_price,
          seller_username: deal.profiles.username,
          rarity: deal.rarity,
          created_at: deal.created_at,
        }));
        setMarketplaceDeals(formatted);
      }
    } catch (error) {
      console.error("Error fetching trending data:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalViews = trendingCards.length > 0 ? trendingCards.length * 8670 : 0;
  const topCollectorCount = topCollectors.length > 0 ? topCollectors[0].card_count * 1000 : 0;

  return (
    <section className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Trending Pulls */}
          <div className="glass-card p-5 rounded-2xl group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
            onClick={() => navigate("/community")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-lg">
                Trending Pulls
              </h3>
              <span className="text-xs px-3 py-1 rounded-full bg-muted/60 text-muted-foreground font-medium border border-border/50">
                {totalViews > 0 ? `${(totalViews / 1000).toFixed(1)}k` : "0"}
              </span>
            </div>
            <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 overflow-hidden">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
              ) : trendingCards.length > 0 ? (
                <>
                  {/* Show the most recent card image */}
                  <img
                    src={trendingCards[0].image_url}
                    alt={trendingCards[0].card_name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Card info */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-semibold truncate mb-1">
                      {trendingCards[0].card_name}
                    </p>
                    <div className="flex items-center gap-2">
                      {trendingCards[0].avatar_url && (
                        <img
                          src={trendingCards[0].avatar_url}
                          alt={trendingCards[0].username}
                          className="w-5 h-5 rounded-full border border-white/30"
                        />
                      )}
                      <span className="text-white/80 text-xs">@{trendingCards[0].username}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground text-sm">
                    <p>No recent pulls yet</p>
                    <p className="text-xs mt-1">Be the first to share!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Collections */}
          <div className="glass-card p-5 rounded-2xl group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
            onClick={() => navigate("/community")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-lg">
                Top Collections
              </h3>
            </div>
            <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 overflow-hidden flex items-center justify-center p-4">
              {loading ? (
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              ) : topCollectors.length > 0 ? (
                <div className="text-center">
                  {topCollectors[0].avatar_url && (
                    <img
                      src={topCollectors[0].avatar_url}
                      alt={topCollectors[0].username}
                      className="w-16 h-16 rounded-full border-2 border-yellow-500/50 mx-auto mb-2"
                    />
                  )}
                  <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-foreground font-semibold">@{topCollectors[0].username}</p>
                  <p className="text-muted-foreground text-sm">{topCollectors[0].card_count} cards</p>

                  {/* View count badge */}
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-cyan-500/90 text-cyan-950 text-sm font-semibold">
                    {topCollectorCount > 0 ? `${(topCollectorCount / 1000).toFixed(1)}k` : "0"}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm">
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No collections yet</p>
                  <p className="text-xs mt-1">Start building yours!</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Marketplace Deals */}
          <div className="glass-card p-5 rounded-2xl group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-lg">
                Live Marketplace Deals
              </h3>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground text-sm py-8">Loading...</div>
              ) : marketplaceDeals.length > 0 ? (
                marketplaceDeals.slice(0, 2).map((deal) => (
                  <DealItem
                    key={deal.id}
                    id={deal.id}
                    seller={deal.seller_username}
                    cardName={deal.card_name}
                    rarity={deal.rarity || "Common"}
                    price={`$${deal.asking_price}`}
                    imageUrl={deal.image_url || (deal.images && deal.images[0]) || null}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No active listings</p>
                  <p className="text-xs mt-1">Check back soon!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DealItem({
  id,
  seller,
  cardName,
  rarity,
  price,
  imageUrl
}: {
  id: string;
  seller: string;
  cardName: string;
  rarity: string;
  price: string;
  imageUrl: string | null;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={() => navigate("/marketplace")}
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/30 overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={cardName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm">📦</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{cardName}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">by @{seller}</p>
        <p className="text-xs text-muted-foreground/60 truncate">{rarity}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-foreground">{price}</p>
      </div>
    </div>
  );
}
