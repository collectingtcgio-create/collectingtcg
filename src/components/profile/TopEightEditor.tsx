import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  Users,
  Loader2,
  Search,
  Plus,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCard {
  id: string;
  card_name: string;
  image_url: string | null;
  card_cache?: { image_url: string | null } | null;
}

interface FollowedFriend {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface TopEightEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: number;
  currentCardId?: string | null;
  currentFriendId?: string | null;
  onUpdate: () => void;
  /** Optional: ID of the profile being viewed (for fetching their collection) */
  viewedProfileId?: string;
  viewedProfileUsername?: string;
}

export function TopEightEditor({
  open,
  onOpenChange,
  position,
  currentCardId,
  currentFriendId,
  onUpdate,
  viewedProfileId,
  viewedProfileUsername,
}: TopEightEditorProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"cards" | "friends" | "their-cards">("cards");
  const [cards, setCards] = useState<UserCard[]>([]);
  const [theirCards, setTheirCards] = useState<UserCard[]>([]);
  const [friends, setFriends] = useState<FollowedFriend[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Whether we're viewing another user's profile
  const isViewingOtherProfile = viewedProfileId && profile && viewedProfileId !== profile.id;

  useEffect(() => {
    if (open && profile) {
      fetchData();
    }
  }, [open, profile, viewedProfileId]);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);

    // Fetch user's own cards
    const { data: cardsData } = await supabase
      .from("user_cards")
      .select("id, card_name, image_url, card_cache(image_url)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (cardsData) {
      setCards(cardsData);
    }

    // If viewing another profile, fetch their cards too
    if (isViewingOtherProfile && viewedProfileId) {
      const { data: theirCardsData } = await supabase
        .from("user_cards")
        .select("id, card_name, image_url, card_cache(image_url)")
        .eq("user_id", viewedProfileId)
        .order("created_at", { ascending: false });

      if (theirCardsData) {
        setTheirCards(theirCardsData);
      }
    }

    // Fetch followed friends
    // We use the followers table where follower_id is us
    const { data: followersData } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", profile.id)
      .eq("status", "approved");

    if (followersData && followersData.length > 0) {
      const followingIds = followersData.map(f => f.following_id);

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", followingIds);

      if (profilesData) {
        setFriends(profilesData);
      }
    } else {
      setFriends([]);
    }

    setLoading(false);
  };

  const handleSelectCard = async (cardId: string) => {
    if (!profile) return;
    setSaving(true);

    try {
      // Check if position exists
      const { data: existing } = await supabase
        .from("top_eight")
        .select("id")
        .eq("user_id", profile.id)
        .eq("position", position)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from("top_eight")
          .update({ card_id: cardId, friend_id: null })
          .eq("id", existing.id);
      } else {
        // Insert new
        await supabase.from("top_eight").insert({
          user_id: profile.id,
          position,
          card_id: cardId,
          friend_id: null,
        });
      }

      toast({ title: "Top 8 updated!" });
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectFriend = async (friendId: string) => {
    if (!profile) return;
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from("top_eight")
        .select("id")
        .eq("user_id", profile.id)
        .eq("position", position)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("top_eight")
          .update({ card_id: null, friend_id: friendId })
          .eq("id", existing.id);
      } else {
        await supabase.from("top_eight").insert({
          user_id: profile.id,
          position,
          card_id: null,
          friend_id: friendId,
        });
      }

      toast({ title: "Top 8 updated!" });
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      await supabase
        .from("top_eight")
        .delete()
        .eq("user_id", profile.id)
        .eq("position", position);

      toast({ title: "Removed from Top 8" });
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to remove",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredCards = cards.filter((c) =>
    c.card_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTheirCards = theirCards.filter((c) =>
    c.card_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  const hasExisting = currentCardId || currentFriendId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card neon-border-cyan max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Edit Top 8 Slot #{position}
          </DialogTitle>
          <DialogDescription>
            Choose a card from your collection or a friend you follow
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className={cn("w-full", isViewingOtherProfile && "grid-cols-3")}>
            <TabsTrigger value="cards" className="flex-1 gap-2">
              <CreditCard className="w-4 h-4" />
              My Cards ({cards.length})
            </TabsTrigger>
            {isViewingOtherProfile && (
              <TabsTrigger value="their-cards" className="flex-1 gap-2">
                <CreditCard className="w-4 h-4" />
                {viewedProfileUsername}'s ({theirCards.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="friends" className="flex-1 gap-2">
              <Users className="w-4 h-4" />
              Friends ({friends.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="mt-4">
            <ScrollArea className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {cards.length === 0 ? "No cards in your collection" : "No cards match your search"}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleSelectCard(card.id)}
                      disabled={saving}
                      className={cn(
                        "aspect-[3/4] rounded-lg bg-muted/50 border border-border/50 overflow-hidden hover:neon-border-cyan transition-all",
                        currentCardId === card.id && "ring-2 ring-primary"
                      )}
                    >
                      {card.card_cache?.image_url || card.image_url ? (
                        <img
                          src={card.card_cache?.image_url || card.image_url}
                          alt={card.card_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-1">
                          <span className="text-[10px] text-center text-muted-foreground line-clamp-3">
                            {card.card_name}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {isViewingOtherProfile && (
            <TabsContent value="their-cards" className="mt-4">
              <ScrollArea className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredTheirCards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {theirCards.length === 0
                      ? `${viewedProfileUsername} has no cards`
                      : "No cards match your search"}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {filteredTheirCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleSelectCard(card.id)}
                        disabled={saving}
                        className={cn(
                          "aspect-[3/4] rounded-lg bg-muted/50 border border-border/50 overflow-hidden hover:neon-border-cyan transition-all",
                          currentCardId === card.id && "ring-2 ring-primary"
                        )}
                      >
                        {card.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.card_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-1">
                            <span className="text-[10px] text-center text-muted-foreground line-clamp-3">
                              {card.card_name}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          )}

          <TabsContent value="friends" className="mt-4">
            <ScrollArea className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {friends.length === 0 ? "You're not following anyone yet" : "No friends match your search"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => handleSelectFriend(friend.id)}
                      disabled={saving}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors",
                        currentFriendId === friend.id && "ring-2 ring-primary"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {friend.avatar_url ? (
                          <img
                            src={friend.avatar_url}
                            alt={friend.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-medium">
                            {friend.username[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{friend.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Remove button */}
        {hasExisting && (
          <Button
            variant="outline"
            onClick={handleRemove}
            disabled={saving}
            className="w-full mt-2 text-destructive border-destructive/50 hover:bg-destructive/10"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Remove from Top 8
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
