import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Search as SearchIcon, Users, Loader2, CreditCard, Plus, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TcgGame } from "@/components/scanner/ScanResultModal";
import { TCG_GAME_LABELS } from "@/components/scanner/ScanResultModal";
import { FriendRequestButton } from "@/components/profile/FriendRequestButton";

interface SearchResult {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  is_live: boolean;
}

interface CardSearchResult {
  id: string;
  external_id: string;
  card_name: string;
  tcg_game: TcgGame;
  set_name?: string;
  set_code?: string;
  card_number?: string;
  rarity?: string;
  image_url?: string;
  price_market?: number;
}

// One Piece sets for manual dropdown
const ONE_PIECE_SETS = [
  { code: 'OP01', name: 'Romance Dawn' },
  { code: 'OP02', name: 'Paramount War' },
  { code: 'OP03', name: 'Pillars of Strength' },
  { code: 'OP04', name: 'Kingdoms of Intrigue' },
  { code: 'OP05', name: 'Awakening of the New Era' },
  { code: 'OP06', name: 'Wings of the Captain' },
  { code: 'OP07', name: '500 Years in the Future' },
  { code: 'OP08', name: 'Two Legends' },
  { code: 'OP09', name: 'The Four Emperors' },
  { code: 'ST01', name: 'Straw Hat Crew' },
  { code: 'ST02', name: 'Worst Generation' },
  { code: 'ST03', name: 'The Seven Warlords of the Sea' },
  { code: 'ST04', name: 'Animal Kingdom Pirates' },
  { code: 'ST05', name: 'One Piece Film Edition' },
  { code: 'ST06', name: 'Absolute Justice' },
  { code: 'ST07', name: 'Big Mom Pirates' },
  { code: 'ST08', name: 'Monkey.D.Luffy' },
  { code: 'ST09', name: 'Yamato' },
  { code: 'ST10', name: 'The Three Captains' },
];

export default function Search() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("players");

  const ALL_SETS_VALUE = "__all_sets__";

  // Player search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Card search
  const [cardQuery, setCardQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<TcgGame | "all">("onepiece");
  const [selectedSet, setSelectedSet] = useState<string>("");
  const [cardResults, setCardResults] = useState<CardSearchResult[]>([]);
  const [cardLoading, setCardLoading] = useState(false);
  const [hasSearchedCards, setHasSearchedCards] = useState(false);
  const [addingCardId, setAddingCardId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    const { data } = await supabase
      .from("profiles")
      .select("id, username, bio, avatar_url, is_live")
      .ilike("username", `%${query}%`)
      .limit(20);

    setResults(data || []);
    setLoading(false);
  };

  const handleCardSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardQuery.trim()) return;

    setCardLoading(true);
    setHasSearchedCards(true);

    try {
      const response = await supabase.functions.invoke("fetch-card-data", {
        body: {
          query: cardQuery.trim(),
          tcg_game: selectedGame === "all" ? undefined : selectedGame,
          set_code: selectedSet || undefined,
          limit: 20,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setCardResults(response.data?.cards || []);
    } catch (error) {
      console.error("Card search error:", error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search cards",
        variant: "destructive",
      });
      setCardResults([]);
    } finally {
      setCardLoading(false);
    }
  };

  const handleAddCard = async (card: CardSearchResult) => {
    if (!profile) {
      toast({
        title: "Not logged in",
        description: "Please log in to add cards to your collection.",
        variant: "destructive",
      });
      return;
    }

    setAddingCardId(card.id);

    try {
      // Map tcg_game to valid database enum (marvel not in DB enum)
      const dbTcgGame = card.tcg_game === 'marvel' ? null : card.tcg_game;

      const { error } = await supabase.from("user_cards").insert({
        user_id: profile.id,
        card_name: card.card_name,
        image_url: card.image_url || null,
        price_estimate: card.price_market || 0,
        tcg_game: dbTcgGame || null,
      });

      if (error) throw error;

      // Add to activity feed
      await supabase.from("activity_feed").insert({
        user_id: profile.id,
        activity_type: "manual_add",
        description: `Added "${card.card_name}" to their collection`,
        metadata: {
          card_name: card.card_name,
          tcg_game: card.tcg_game,
          set_name: card.set_name,
        },
      });

      toast({
        title: "Card Added!",
        description: `${card.card_name} has been added to your collection.`,
      });
    } catch (error) {
      console.error("Error adding card:", error);
      toast({
        title: "Failed to add card",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setAddingCardId(null);
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Search
          </h1>
          <p className="text-muted-foreground">
            Find players or search for cards to add to your collection
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
            <TabsTrigger value="players" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Cards
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="glass-card p-4 neon-border-cyan flex gap-3">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by username..."
                    className="pl-10 bg-input border-border"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-full px-6 bg-primary hover:bg-primary/80 text-primary-foreground hover:neon-glow-cyan transition-all duration-300"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </form>

            {/* Results */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : hasSearched && results.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No players found matching "{query}"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Link
                    key={result.id}
                    to={`/profile/${result.id}`}
                    className="block"
                  >
                    <div
                      className="glass-card p-4 hover:neon-border-cyan transition-all duration-300 fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`relative ${result.is_live ? "live-border" : ""}`}>
                          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {result.avatar_url ? (
                              <img
                                src={result.avatar_url}
                                alt={result.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-bold text-muted-foreground">
                                {result.username[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{result.username}</h3>
                            {result.is_live && (
                              <span className="px-2 py-0.5 text-xs bg-secondary/20 text-secondary rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                                LIVE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.bio || "No bio"}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {profile && result.id !== profile.id && (
                            <FriendRequestButton
                              targetUserId={result.id}
                              size="sm"
                              variant="outline"
                            />
                          )}
                          <Button
                            variant="ghost"
                            className="rounded-full hover:bg-primary/10 hover:text-primary"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!hasSearched && (
              <div className="glass-card p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Find Your Community</h3>
                <p className="text-muted-foreground">
                  Search for other collectors by username to connect and follow
                </p>
              </div>
            )}
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards">
            {/* Card Search Form */}
            <form onSubmit={handleCardSearch} className="mb-8 space-y-4">
              <div className="glass-card p-4 neon-border-magenta space-y-4">
                {/* Game Selection */}
                <div className="flex gap-3">
                  <Select
                    value={selectedGame}
                    onValueChange={(value) => {
                      setSelectedGame(value as TcgGame | "all");
                      if (value !== "onepiece") setSelectedSet("");
                    }}
                  >
                    <SelectTrigger className="w-[180px] bg-background">
                      <SelectValue placeholder="Select game" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
                      <SelectItem value="all">All Games</SelectItem>
                      <SelectItem value="onepiece">One Piece</SelectItem>
                      <SelectItem value="pokemon">Pokémon</SelectItem>
                      <SelectItem value="magic">Magic: The Gathering</SelectItem>
                      <SelectItem value="yugioh">Yu-Gi-Oh!</SelectItem>
                      <SelectItem value="dragonball">Dragon Ball</SelectItem>
                      <SelectItem value="lorcana">Disney Lorcana</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* One Piece Set Dropdown */}
                  {selectedGame === "onepiece" && (
                    <Select
                      value={selectedSet === "" ? ALL_SETS_VALUE : selectedSet}
                      onValueChange={(v) => setSelectedSet(v === ALL_SETS_VALUE ? "" : v)}
                    >
                      <SelectTrigger className="flex-1 bg-background">
                        <SelectValue placeholder="All Sets" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border z-50 max-h-[300px]">
                        <SelectItem value={ALL_SETS_VALUE}>All Sets</SelectItem>
                        {ONE_PIECE_SETS.map((set) => (
                          <SelectItem key={set.code} value={set.code}>
                            {set.code} - {set.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Search Input */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      value={cardQuery}
                      onChange={(e) => setCardQuery(e.target.value)}
                      placeholder="Search card name..."
                      className="pl-10 bg-input border-border"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={cardLoading}
                    className="rounded-full px-6 bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:neon-glow-magenta transition-all duration-300"
                  >
                    {cardLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Card Results */}
            {cardLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-secondary" />
              </div>
            ) : hasSearchedCards && cardResults.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No cards found matching "{cardQuery}"
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try a different search term or set filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {cardResults.map((card, index) => (
                  <div
                    key={card.id || index}
                    className="glass-card p-3 hover:neon-border-cyan transition-all duration-300 fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Card Image */}
                    <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden bg-muted mb-3">
                      {card.image_url ? (
                        <img
                          src={card.image_url}
                          alt={card.card_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <ImageOff className="w-8 h-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm truncate" title={card.card_name}>
                        {card.card_name}
                      </h4>

                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {TCG_GAME_LABELS[card.tcg_game]}
                        </Badge>
                        {card.card_number && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/20">
                            #{card.card_number}
                          </Badge>
                        )}
                      </div>

                      {card.price_market && (
                        <p className="text-sm font-medium text-secondary">
                          {formatPrice(card.price_market)}
                        </p>
                      )}

                      {/* Add Button */}
                      <Button
                        size="sm"
                        className="w-full rounded-full text-xs"
                        onClick={() => handleAddCard(card)}
                        disabled={addingCardId === card.id}
                      >
                        {addingCardId === card.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3 h-3 mr-1" />
                            Add to Binder
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!hasSearchedCards && (
              <div className="glass-card p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Search for Cards</h3>
                <p className="text-muted-foreground">
                  Find cards from One Piece, Pokémon, and other TCGs to add to your collection
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Use the set dropdown for One Piece to narrow your search
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
