import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  UserMinus, 
  Users, 
  Grid3X3, 
  MessageSquare, 
  Send,
  Loader2,
  CreditCard
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  bio: string;
  avatar_url: string;
  is_live: boolean;
}

interface TopEightItem {
  id: string;
  position: number;
  card_id: string | null;
  friend_id: string | null;
  user_cards?: {
    id: string;
    card_name: string;
    image_url: string;
  };
  friend?: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

interface Kudo {
  id: string;
  message: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export default function Profile() {
  const { id } = useParams();
  const { user, profile: currentProfile } = useAuth();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [topEight, setTopEight] = useState<TopEightItem[]>([]);
  const [kudos, setKudos] = useState<Kudo[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kudoText, setKudoText] = useState("");
  const [sendingKudo, setSendingKudo] = useState(false);

  const isOwnProfile = !id || (currentProfile && id === currentProfile.id);
  const targetProfileId = id || currentProfile?.id;

  useEffect(() => {
    if (targetProfileId) {
      fetchProfileData();
    }
  }, [targetProfileId, currentProfile]);

  const fetchProfileData = async () => {
    if (!targetProfileId) return;

    setLoading(true);

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetProfileId)
      .single();

    if (profile) {
      setProfileData(profile);
    }

    // Fetch top eight with related data
    const { data: topEightData } = await supabase
      .from("top_eight")
      .select(`
        *,
        user_cards(id, card_name, image_url),
        friend:profiles!top_eight_friend_id_fkey(id, username, avatar_url)
      `)
      .eq("user_id", targetProfileId)
      .order("position");

    if (topEightData) {
      setTopEight(topEightData as unknown as TopEightItem[]);
    }

    // Fetch kudos
    const { data: kudosData } = await supabase
      .from("kudos")
      .select(`
        *,
        author:profiles!kudos_author_id_fkey(id, username, avatar_url)
      `)
      .eq("profile_id", targetProfileId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (kudosData) {
      setKudos(kudosData as unknown as Kudo[]);
    }

    // Fetch follower/following counts
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetProfileId);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetProfileId);

    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);

    // Check if current user follows this profile
    if (currentProfile && !isOwnProfile) {
      const { data: followData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentProfile.id)
        .eq("following_id", targetProfileId)
        .maybeSingle();

      setIsFollowing(!!followData);
    }

    setLoading(false);
  };

  const handleFollow = async () => {
    if (!currentProfile || !targetProfileId) return;

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentProfile.id)
        .eq("following_id", targetProfileId);

      setIsFollowing(false);
      setFollowerCount((prev) => prev - 1);
    } else {
      await supabase.from("follows").insert({
        follower_id: currentProfile.id,
        following_id: targetProfileId,
      });

      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    }
  };

  const handleSendKudo = async () => {
    if (!currentProfile || !targetProfileId || !kudoText.trim()) return;

    setSendingKudo(true);

    const { data, error } = await supabase
      .from("kudos")
      .insert({
        profile_id: targetProfileId,
        author_id: currentProfile.id,
        message: kudoText.trim(),
      })
      .select(`
        *,
        author:profiles!kudos_author_id_fkey(id, username, avatar_url)
      `)
      .single();

    if (error) {
      toast({
        title: "Failed to send kudos",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setKudos((prev) => [data as unknown as Kudo, ...prev]);
      setKudoText("");
      toast({
        title: "Kudos sent!",
        description: "Your message has been posted.",
      });
    }

    setSendingKudo(false);
  };

  if (!user && !id) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profileData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 text-center py-12">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Header */}
        <div className="glass-card p-6 md:p-8 mb-6 neon-border-cyan fade-in">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className={`relative ${profileData.is_live ? "live-border" : ""}`}>
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt={profileData.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-muted-foreground">
                    {profileData.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              {profileData.is_live && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full">
                  LIVE
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {profileData.username}
              </h1>
              <p className="text-muted-foreground mb-4">
                {profileData.bio || "No bio yet"}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold">{followerCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>

              {/* Follow Button */}
              {!isOwnProfile && user && (
                <Button
                  onClick={handleFollow}
                  className={`rounded-full px-6 transition-all duration-300 ${
                    isFollowing
                      ? "bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground"
                      : "bg-primary text-primary-foreground hover:neon-glow-cyan"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Top Eight */}
        <div className="glass-card p-6 mb-6 neon-border-magenta fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-secondary" />
            TOP EIGHT
          </h2>

          <div className="grid grid-cols-4 gap-3">
            {[...Array(8)].map((_, index) => {
              const item = topEight.find((t) => t.position === index + 1);
              
              return (
                <div
                  key={index}
                  className="aspect-square rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden hover:neon-border-cyan transition-all duration-300"
                >
                  {item?.user_cards ? (
                    <div className="w-full h-full relative group">
                      {item.user_cards.image_url ? (
                        <img
                          src={item.user_cards.image_url}
                          alt={item.user_cards.card_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                        <p className="text-xs font-medium truncate">
                          {item.user_cards.card_name}
                        </p>
                      </div>
                    </div>
                  ) : item?.friend ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-1 overflow-hidden">
                        {item.friend.avatar_url ? (
                          <img
                            src={item.friend.avatar_url}
                            alt={item.friend.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {item.friend.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">
                        {item.friend.username}
                      </p>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Users className="w-6 h-6" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kudos Wall */}
        <div className="glass-card p-6 neon-border-cyan fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Kudos Wall
          </h2>

          {/* Send Kudos Form */}
          {user && !isOwnProfile && (
            <div className="flex gap-3 mb-6">
              <Textarea
                value={kudoText}
                onChange={(e) => setKudoText(e.target.value)}
                placeholder="Leave some kudos..."
                className="bg-input border-border resize-none"
                rows={2}
              />
              <Button
                onClick={handleSendKudo}
                disabled={sendingKudo || !kudoText.trim()}
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/80 hover:neon-glow-cyan flex-shrink-0 self-end"
              >
                {sendingKudo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}

          {/* Kudos List */}
          {kudos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No kudos yet. Be the first to leave some!
            </p>
          ) : (
            <div className="space-y-4">
              {kudos.map((kudo) => (
                <div
                  key={kudo.id}
                  className="flex gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {kudo.author?.avatar_url ? (
                      <img
                        src={kudo.author.avatar_url}
                        alt={kudo.author.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {kudo.author?.username?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {kudo.author?.username || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(kudo.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{kudo.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
