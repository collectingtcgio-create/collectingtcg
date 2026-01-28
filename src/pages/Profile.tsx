import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SendMessageModal } from "@/components/messages/SendMessageModal";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { TopEightEditor } from "@/components/profile/TopEightEditor";
import { SocialLinksEditor, SocialLinksDisplay } from "@/components/profile/SocialLinksEditor";
import { 
  UserPlus, 
  UserMinus, 
  Users, 
  Grid3X3, 
  MessageSquare, 
  Send,
  Loader2,
  CreditCard,
  Mail,
  Star,
  Share2,
  Ban,
  Link as LinkIcon,
  Plus
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  bio: string;
  avatar_url: string;
  is_live: boolean;
  created_at: string;
  updated_at: string;
  email_contact?: string;
  tiktok_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  website_url?: string;
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
  const { blockUser, isUserBlocked } = useUserSettings();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [topEight, setTopEight] = useState<TopEightItem[]>([]);
  const [kudos, setKudos] = useState<Kudo[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kudoText, setKudoText] = useState("");
  const [sendingKudo, setSendingKudo] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [topEightEditorOpen, setTopEightEditorOpen] = useState(false);
  const [selectedTopEightPosition, setSelectedTopEightPosition] = useState(1);
  const [socialLinksEditorOpen, setSocialLinksEditorOpen] = useState(false);

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

    // Fetch follower/following/card counts
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetProfileId);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetProfileId);

    const { count: cards } = await supabase
      .from("user_cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetProfileId);

    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);
    setCardCount(cards || 0);

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
      <div className="container mx-auto px-4 max-w-6xl">
        {/* MySpace-style Header Banner */}
        <div className="glass-card p-4 mb-4 neon-border-cyan fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {profileData.username}
            </h1>
            {!isOwnProfile && user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden md:block">
                  {isFollowing ? "In your network" : "Add to your network"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Profile Card & Contact Box */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Card */}
            <div className="glass-card p-4 neon-border-magenta fade-in" style={{ animationDelay: "50ms" }}>
              {/* Avatar */}
              <div className="mb-4">
                {isOwnProfile ? (
                  <AvatarUpload
                    currentAvatar={profileData.avatar_url}
                    username={profileData.username}
                    isLive={profileData.is_live}
                    onUploadComplete={() => fetchProfileData()}
                  />
                ) : (
                  <div className={`relative inline-block ${profileData.is_live ? "live-border" : ""}`}>
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                      {profileData.avatar_url ? (
                        <img
                          src={profileData.avatar_url}
                          alt={profileData.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl font-bold text-muted-foreground">
                          {profileData.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    {profileData.is_live && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full animate-pulse">
                        🔴 LIVE
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="space-y-2 text-sm">
                <p className="font-medium">{profileData.username}</p>
                <p className="text-muted-foreground">
                  {cardCount} cards collected
                </p>
                <p className="text-muted-foreground">
                  Member since {format(new Date(profileData.created_at), "MMM yyyy")}
                </p>
                <p className="text-muted-foreground">
                  Last updated: {formatDistanceToNow(new Date(profileData.updated_at), { addSuffix: true })}
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-border/50 text-center">
                <div className="flex-1">
                  <p className="text-lg font-bold text-primary">{followerCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-secondary">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>

              {/* View Links (MySpace style) */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">View My:</p>
                <div className="flex gap-2 text-xs">
                  <Link to={`/collections`} className="text-primary hover:underline">Cards</Link>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">Decks</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">Wishlist</span>
                </div>
              </div>
            </div>

            {/* Contacting Box (MySpace style) */}
            <div className="glass-card overflow-hidden fade-in" style={{ animationDelay: "100ms" }}>
              <div className="bg-primary/20 px-4 py-2 border-b border-border/50">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Contacting {profileData.username}
                </h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {!isOwnProfile && user && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMessageModalOpen(true)}
                      className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary"
                    >
                      <Mail className="w-3 h-3 mr-2" />
                      Send Message
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFollow}
                      className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-3 h-3 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-2" />
                          Add to Friends
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary"
                      disabled
                    >
                      <Star className="w-3 h-3 mr-2" />
                      Add to Favorites
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary"
                      disabled
                    >
                      <Share2 className="w-3 h-3 mr-2" />
                      Forward to Friend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (targetProfileId) {
                          blockUser.mutate(targetProfileId);
                        }
                      }}
                      disabled={blockUser.isPending || isUserBlocked(targetProfileId || "")}
                      className="justify-start text-xs h-8 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Ban className="w-3 h-3 mr-2" />
                      {isUserBlocked(targetProfileId || "") ? "Blocked" : "Block User"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary"
                      disabled
                    >
                      <Star className="w-3 h-3 mr-2" />
                      Rank User
                    </Button>
                    {/* Social Links Display for other profiles */}
                    <div className="col-span-2 pt-2 border-t border-border/50">
                      <SocialLinksDisplay
                        links={{
                          email_contact: profileData.email_contact || "",
                          tiktok_url: profileData.tiktok_url || "",
                          twitter_url: profileData.twitter_url || "",
                          instagram_url: profileData.instagram_url || "",
                          facebook_url: profileData.facebook_url || "",
                          website_url: profileData.website_url || "",
                        }}
                        isOwnProfile={false}
                        onEditClick={() => {}}
                      />
                    </div>
                  </>
                )}
                {isOwnProfile && (
                  <div className="col-span-2 space-y-3">
                    <p className="text-xs text-muted-foreground text-center pb-2 border-b border-border/50">
                      This is your profile
                    </p>
                    <SocialLinksDisplay
                      links={{
                        email_contact: profileData.email_contact || "",
                        tiktok_url: profileData.tiktok_url || "",
                        twitter_url: profileData.twitter_url || "",
                        instagram_url: profileData.instagram_url || "",
                        facebook_url: profileData.facebook_url || "",
                        website_url: profileData.website_url || "",
                      }}
                      isOwnProfile={true}
                      onEditClick={() => setSocialLinksEditorOpen(true)}
                    />
                  </div>
                )}
                {!user && (
                  <Link to="/auth" className="col-span-2">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Sign in to contact
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Profile URL Box */}
            <div className="glass-card p-3 fade-in" style={{ animationDelay: "150ms" }}>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                Profile URL:
              </p>
              <p className="text-xs font-mono text-primary truncate">
                {window.location.origin}/profile/{profileData.id}
              </p>
            </div>
          </div>

          {/* Right Column - Blurbs, Top 8, Kudos */}
          <div className="lg:col-span-2 space-y-4">
            {/* Network Status Banner */}
            {!isOwnProfile && (
              <div className="glass-card p-4 text-center fade-in" style={{ animationDelay: "50ms" }}>
                <p className="font-semibold text-lg">
                  {isFollowing ? (
                    <span className="text-primary">✓ {profileData.username} is in your network</span>
                  ) : (
                    <span className="text-muted-foreground">{profileData.username} is in your extended network</span>
                  )}
                </p>
              </div>
            )}

            {/* Blurbs Section (MySpace style) */}
            <div className="glass-card overflow-hidden fade-in" style={{ animationDelay: "100ms" }}>
              <div className="bg-secondary/20 px-4 py-2 border-b border-border/50">
                <h3 className="font-semibold text-sm text-secondary">
                  {profileData.username}'s Blurbs
                </h3>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm text-primary mb-2">About me:</h4>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {profileData.bio || "No bio yet. This collector hasn't written about themselves."}
                </p>
              </div>
            </div>

            {/* Top Eight (MySpace style) */}
            <div className="glass-card overflow-hidden fade-in" style={{ animationDelay: "150ms" }}>
              <div className="bg-secondary/20 px-4 py-2 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-secondary flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  {profileData.username}'s Top 8
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({topEight.length}/8)
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(8)].map((_, index) => {
                    const item = topEight.find((t) => t.position === index + 1);
                    const position = index + 1;
                    
                    const handleClick = () => {
                      if (isOwnProfile) {
                        setSelectedTopEightPosition(position);
                        setTopEightEditorOpen(true);
                      }
                    };
                    
                    return (
                      <div
                        key={index}
                        onClick={handleClick}
                        className={`aspect-square rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden hover:neon-border-cyan transition-all duration-300 cursor-pointer group relative ${isOwnProfile ? "hover:ring-2 hover:ring-primary/50" : ""}`}
                      >
                        {/* Edit overlay for own profile */}
                        {isOwnProfile && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Plus className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        
                        {item?.user_cards ? (
                          <div className="w-full h-full relative">
                            {item.user_cards.image_url ? (
                              <img
                                src={item.user_cards.image_url}
                                alt={item.user_cards.card_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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
                          <div
                            onClick={(e) => {
                              if (!isOwnProfile) {
                                e.stopPropagation();
                                window.location.href = `/profile/${item.friend!.id}`;
                              }
                            }}
                            className="w-full h-full flex flex-col items-center justify-center p-2 group-hover:scale-105 transition-transform"
                          >
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-1 overflow-hidden ring-2 ring-primary/30">
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
                            <p className="text-xs font-medium truncate text-primary">
                              {item.friend.username}
                            </p>
                          </div>
                        ) : (
                          <div className="text-muted-foreground/30">
                            {isOwnProfile ? (
                              <Plus className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                            ) : (
                              <Users className="w-6 h-6" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Kudos Wall (Comments section - MySpace style) */}
            <div className="glass-card overflow-hidden fade-in" style={{ animationDelay: "200ms" }}>
              <div className="bg-primary/20 px-4 py-2 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  {profileData.username}'s Kudos Wall
                </h3>
                <span className="text-xs text-muted-foreground">
                  {kudos.length} comments
                </span>
              </div>
              <div className="p-4">
                {/* Send Kudos Form */}
                {user && !isOwnProfile && (
                  <div className="flex gap-3 mb-6 pb-4 border-b border-border/50">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {currentProfile?.avatar_url ? (
                        <img
                          src={currentProfile.avatar_url}
                          alt={currentProfile.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {currentProfile?.username?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        value={kudoText}
                        onChange={(e) => setKudoText(e.target.value)}
                        placeholder={`Leave ${profileData.username} some kudos...`}
                        className="bg-input border-border resize-none mb-2"
                        rows={2}
                      />
                      <Button
                        onClick={handleSendKudo}
                        disabled={sendingKudo || !kudoText.trim()}
                        size="sm"
                        className="rounded-full bg-primary hover:bg-primary/80 hover:neon-glow-cyan"
                      >
                        {sendingKudo ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Post Kudos
                      </Button>
                    </div>
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
                        className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <Link to={`/profile/${kudo.author?.id}`}>
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-transparent hover:ring-primary/50 transition-all">
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
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              to={`/profile/${kudo.author?.id}`}
                              className="font-medium text-sm text-primary hover:underline"
                            >
                              {kudo.author?.username || "Unknown"}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(kudo.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80">{kudo.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Message Modal */}
      {profileData && (
        <SendMessageModal
          open={messageModalOpen}
          onOpenChange={setMessageModalOpen}
          recipientId={profileData.id}
          recipientUsername={profileData.username}
        />
      )}

      {/* Top Eight Editor Modal */}
      {isOwnProfile && (
        <TopEightEditor
          open={topEightEditorOpen}
          onOpenChange={setTopEightEditorOpen}
          position={selectedTopEightPosition}
          currentCardId={topEight.find((t) => t.position === selectedTopEightPosition)?.card_id}
          currentFriendId={topEight.find((t) => t.position === selectedTopEightPosition)?.friend_id}
          onUpdate={fetchProfileData}
        />
      )}

      {/* Social Links Editor Modal */}
      {isOwnProfile && profileData && (
        <SocialLinksEditor
          open={socialLinksEditorOpen}
          onOpenChange={setSocialLinksEditorOpen}
          currentLinks={{
            email_contact: profileData.email_contact || "",
            tiktok_url: profileData.tiktok_url || "",
            twitter_url: profileData.twitter_url || "",
            instagram_url: profileData.instagram_url || "",
            facebook_url: profileData.facebook_url || "",
            website_url: profileData.website_url || "",
          }}
          onUpdate={fetchProfileData}
        />
      )}
    </Layout>
  );
}
