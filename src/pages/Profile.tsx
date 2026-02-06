import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useFriendships } from "@/hooks/useFriendships";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SendMessageModal } from "@/components/messages/SendMessageModal";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { TopEightEditor } from "@/components/profile/TopEightEditor";
import { SocialLinksEditor, SocialLinksDisplay } from "@/components/profile/SocialLinksEditor";
import { BioEditor } from "@/components/profile/BioEditor";
import { StatusEditor, StatusDisplay } from "@/components/profile/StatusEditor";
import { WallPosts } from "@/components/profile/WallPosts";
import { FollowingFeed } from "@/components/profile/FollowingFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatorBadge } from "@/components/profile/CreatorBadge";
import { FollowersModal } from "@/components/profile/FollowersModal";
import { CardPreviewModal } from "@/components/profile/CardPreviewModal";
import { UserCollectionModal } from "@/components/profile/UserCollectionModal";
// import { GlobalPostSection } from "@/components/profile/GlobalPostSection";
import { MusicPlayerSection } from "@/components/profile/MusicPlayerSection";
import { OnlineStatusBadge } from "@/components/profile/OnlineStatusBadge";
import { FriendRequestButton } from "@/components/profile/FriendRequestButton";
import { FollowButton } from "@/components/profile/FollowButton";
import {
  UserPlus,
  UserMinus,
  Users,
  Grid3X3,
  MessageSquare,
  Loader2,
  CreditCard,
  Mail,
  Star,
  Share2,
  Ban,
  Link as LinkIcon,
  Plus,
  BookOpen,
  Lock,
  ShieldAlert
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
  status?: string;
  email_contact?: string;
  tiktok_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  website_url?: string;
  rumble_url?: string;
  youtube_url?: string;
  spotify_playlist_url?: string;
  youtube_playlist_url?: string;
  music_autoplay?: boolean;
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

export default function Profile() {
  const { id } = useParams();
  const { user, profile: currentProfile } = useAuth();
  const { toast } = useToast();
  const { blockUser, isUserBlocked } = useUserSettings();
  const { getFriendshipStatus } = useFriendships();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [topEight, setTopEight] = useState<TopEightItem[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [topEightEditorOpen, setTopEightEditorOpen] = useState(false);
  const [selectedTopEightPosition, setSelectedTopEightPosition] = useState(1);
  const [socialLinksEditorOpen, setSocialLinksEditorOpen] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following" | "friends">("followers");
  const [cardPreviewOpen, setCardPreviewOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<{ imageUrl: string | null; cardName: string } | null>(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);

  const isOwnProfile = !id || (currentProfile && id === currentProfile.id);
  const targetProfileId = id || currentProfile?.id;

  // Online status tracking for current user
  useOnlineStatus();

  // Get privacy settings for target profile
  const { settings: targetPrivacySettings } = usePrivacySettings(targetProfileId);

  // Check if current user can view this profile
  const canViewProfile = () => {
    if (isOwnProfile) return true;
    if (!targetPrivacySettings) return true; // Default to public
    if (targetPrivacySettings.profile_visibility === "public") return true;
    if (targetPrivacySettings.profile_visibility === "private") return false;
    if (targetPrivacySettings.profile_visibility === "friends_only") {
      const friendStatus = getFriendshipStatus(targetProfileId || "");
      return friendStatus.isFriend;
    }
    return true;
  };

  // Check if blocked
  const isBlocked = isUserBlocked(targetProfileId || "");

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

    // Fetch follower/following/card/friend counts
    const { count: followers } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetProfileId)
      .eq("status", "approved");

    const { count: following } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetProfileId)
      .eq("status", "approved");

    const { count: cards } = await supabase
      .from("user_cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetProfileId);

    // Count accepted friendships
    const { count: friendsAsRequester } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("requester_id", targetProfileId)
      .eq("status", "accepted");

    const { count: friendsAsAddressee } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("addressee_id", targetProfileId)
      .eq("status", "accepted");

    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);
    setCardCount(cards || 0);
    setFriendCount((friendsAsRequester || 0) + (friendsAsAddressee || 0));

    // Check if current user follows this profile
    if (currentProfile && !isOwnProfile) {
      const { data: followData } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", currentProfile.id)
        .eq("following_id", targetProfileId)
        .eq("status", "approved")
        .maybeSingle();

      setIsFollowing(!!followData);
    }

    setLoading(false);
  };



  const handleMusicSave = async (youtubeUrl: string, autoplay: boolean) => {
    if (!currentProfile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        youtube_playlist_url: youtubeUrl,
        music_autoplay: autoplay,
      })
      .eq("id", currentProfile.id);

    if (error) {
      toast({
        title: "Failed to save music",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Music updated",
      description: "Your music player settings have been saved.",
    });

    fetchProfileData();
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

  // Check if profile is blocked or private
  if (isBlocked && !isOwnProfile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 text-center py-12">
          <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Profile Unavailable</h2>
          <p className="text-muted-foreground">This profile is not available.</p>
        </div>
      </Layout>
    );
  }

  // Check if profile is private or friends-only (and user is not a friend)
  if (!canViewProfile() && !isOwnProfile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="glass-card p-8 text-center neon-border-cyan">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{profileData.username}</h2>
            <p className="text-muted-foreground mb-6">
              {targetPrivacySettings?.profile_visibility === "private"
                ? "This profile is private."
                : "This profile is only visible to friends."}
            </p>
            {targetPrivacySettings?.profile_visibility === "friends_only" && user && (
              <div className="flex justify-center gap-3">
                <FriendRequestButton targetUserId={targetProfileId || ""} />
              </div>
            )}
          </div>
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-2">
                {profileData.username}
                <CreatorBadge userId={profileData.user_id} />
              </h1>
              {!isOwnProfile && (
                <OnlineStatusBadge userId={targetProfileId || ""} showLastSeen />
              )}
            </div>
            {!isOwnProfile && user && (
              <div className="flex items-center gap-2">
                <FriendRequestButton targetUserId={targetProfileId || ""} size="sm" />
                <FollowButton targetUserId={targetProfileId || ""} size="sm" />
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
                <p className="font-medium flex items-center gap-1.5">
                  {profileData.username}
                  <CreatorBadge userId={profileData.user_id} className="inline-flex" />
                </p>

                {/* Status */}
                {isOwnProfile ? (
                  <StatusEditor
                    currentStatus={profileData.status || ""}
                    onUpdate={fetchProfileData}
                  />
                ) : (
                  <StatusDisplay status={profileData.status || ""} />
                )}

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

              {/* Stats Row - Clickable */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/50 text-center">
                <button
                  onClick={() => {
                    setFollowersModalTab("followers");
                    setFollowersModalOpen(true);
                  }}
                  className="flex-1 hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer"
                >
                  <p className="text-lg font-bold text-primary">{followerCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </button>
                <button
                  onClick={() => {
                    setFollowersModalTab("following");
                    setFollowersModalOpen(true);
                  }}
                  className="flex-1 hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer"
                >
                  <p className="text-lg font-bold text-secondary">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </button>
                <button
                  onClick={() => {
                    setFollowersModalTab("friends");
                    setFollowersModalOpen(true);
                  }}
                  className="flex-1 hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer"
                >
                  <p className="text-lg font-bold text-accent">{friendCount}</p>
                  <p className="text-xs text-muted-foreground">Friends</p>
                </button>
              </div>

              {/* View Links (MySpace style) */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">View {isOwnProfile ? "My" : `${profileData.username}'s`}:</p>
                <div className="flex gap-2 text-xs flex-wrap">
                  {isOwnProfile ? (
                    <Link to="/collections" className="text-primary hover:underline">Cards</Link>
                  ) : (
                    <button
                      onClick={() => setCollectionModalOpen(true)}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      Collection
                    </button>
                  )}
                  <span className="text-muted-foreground">|</span>
                  <Link
                    to={isOwnProfile ? "/marketplace?tab=my-listings" : `/marketplace?seller=${targetProfileId}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    Selling
                  </Link>
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
                    <FollowButton
                      targetUserId={targetProfileId || ""}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary"
                    />
                    <FriendRequestButton
                      targetUserId={targetProfileId || ""}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary col-span-2"
                    />
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
                          rumble_url: profileData.rumble_url || "",
                          youtube_url: profileData.youtube_url || "",
                        }}
                        isOwnProfile={false}
                        onEditClick={() => { }}
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
                        rumble_url: profileData.rumble_url || "",
                        youtube_url: profileData.youtube_url || "",
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
                {isOwnProfile ? (
                  <BioEditor
                    currentBio={profileData.bio || ""}
                    onUpdate={fetchProfileData}
                  />
                ) : (
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                    {profileData.bio || "No bio yet. This collector hasn't written about themselves."}
                  </p>
                )}
              </div>
            </div>

            {/* Music Player Section */}
            <div className="glass-card overflow-hidden fade-in" style={{ animationDelay: "125ms" }}>
              <div className="p-4">
                <MusicPlayerSection
                  youtubeUrl={profileData.youtube_playlist_url || ""}
                  autoplay={profileData.music_autoplay || false}
                  isOwnProfile={isOwnProfile}
                  onSave={handleMusicSave}
                />
              </div>
            </div>

            <div className="glass-card overflow-hidden fade-in relative" style={{ animationDelay: "150ms" }}>
              <div className="bg-secondary/20 px-4 py-2 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-secondary flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  {profileData.username}'s Top 8
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    ({topEight.length}/8)
                  </span>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Find first empty position
                        const filledPositions = topEight.map(t => t.position);
                        const emptyPosition = [1, 2, 3, 4, 5, 6, 7, 8].find(p => !filledPositions.includes(p)) || 1;
                        setSelectedTopEightPosition(emptyPosition);
                        setTopEightEditorOpen(true);
                      }}
                      className="h-7 px-2 text-xs hover:bg-primary/20"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
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
                      } else if (item?.user_cards) {
                        // Show card preview for non-owners
                        setPreviewCard({
                          imageUrl: item.user_cards.image_url,
                          cardName: item.user_cards.card_name,
                        });
                        setCardPreviewOpen(true);
                      }
                    };

                    return (
                      <div
                        key={index}
                        onClick={isOwnProfile ? handleClick : (item?.user_cards || item?.friend) ? handleClick : undefined}
                        className={`aspect-square rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden transition-all duration-300 group relative ${isOwnProfile
                          ? "cursor-pointer hover:neon-border-cyan hover:ring-2 hover:ring-primary/50"
                          : (item?.user_cards || item?.friend)
                            ? "cursor-pointer hover:neon-border-cyan"
                            : ""
                          }`}
                      >
                        {item?.user_cards ? (
                          <div className="w-full h-full relative">
                            {item.user_cards.image_url ? (
                              <img
                                src={item.user_cards.image_url}
                                alt={item.user_cards.card_name}
                                className="w-full h-full object-contain bg-muted/30 group-hover:scale-105 transition-transform"
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
                            className="w-full h-full flex flex-col items-center justify-center p-1 group-hover:scale-105 transition-transform"
                          >
                            <div className="w-4/5 aspect-square rounded-full bg-muted flex items-center justify-center mb-1 overflow-hidden ring-2 ring-primary/30">
                              {item.friend.avatar_url ? (
                                <img
                                  src={item.friend.avatar_url}
                                  alt={item.friend.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl font-medium">
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
                            <Users className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Global Post Section removed as per request */}


            {/* Wall Posts (Facebook-style - MySpace inspired) */}
            {/* Wall Posts (Facebook-style - MySpace inspired) */}
            <div className="glass-card overflow-hidden fade-in" style={{ animationDelay: "200ms" }}>
              {isOwnProfile ? (
                <Tabs defaultValue="wall" className="w-full">
                  <div className="bg-primary/20 px-4 py-2 border-b border-border/50 flex items-center justify-between">
                    <TabsList className="bg-transparent p-0 h-auto">
                      <TabsTrigger
                        value="wall"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:underline data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2 pb-1"
                      >
                        <span className="font-semibold text-sm flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          My Wall
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="feed"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:underline data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2 pb-1"
                      >
                        <span className="font-semibold text-sm flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Followers Feed
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="p-4">
                    <TabsContent value="wall" className="mt-0">
                      <WallPosts
                        profileId={profileData.id}
                        profileUsername={profileData.username}
                        isOwnProfile={isOwnProfile}
                      />
                    </TabsContent>
                    <TabsContent value="feed" className="mt-0">
                      <FollowingFeed />
                    </TabsContent>
                  </div>
                </Tabs>
              ) : (
                <>
                  <div className="bg-primary/20 px-4 py-2 border-b border-border/50">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      {profileData.username}'s Wall
                    </h3>
                  </div>
                  <div className="p-4">
                    <WallPosts
                      profileId={profileData.id}
                      profileUsername={profileData.username}
                      isOwnProfile={isOwnProfile}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Send Message Modal */}
      {
        profileData && (
          <SendMessageModal
            open={messageModalOpen}
            onOpenChange={setMessageModalOpen}
            recipientId={profileData.id}
            recipientUsername={profileData.username}
          />
        )
      }

      {/* Top Eight Editor Modal */}
      <TopEightEditor
        open={topEightEditorOpen}
        onOpenChange={setTopEightEditorOpen}
        position={selectedTopEightPosition}
        currentCardId={topEight.find((t) => t.position === selectedTopEightPosition)?.card_id}
        currentFriendId={topEight.find((t) => t.position === selectedTopEightPosition)?.friend_id}
        onUpdate={fetchProfileData}
        viewedProfileId={!isOwnProfile ? targetProfileId : undefined}
        viewedProfileUsername={!isOwnProfile ? profileData?.username : undefined}
      />

      {/* Social Links Editor Modal */}
      {
        isOwnProfile && profileData && (
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
              rumble_url: profileData.rumble_url || "",
              youtube_url: profileData.youtube_url || "",
            }}
            onUpdate={fetchProfileData}
          />
        )
      }

      {/* Followers Modal */}
      {
        profileData && (
          <FollowersModal
            open={followersModalOpen}
            onOpenChange={setFollowersModalOpen}
            profileId={profileData.id}
            profileUsername={profileData.username}
            initialTab={followersModalTab}
            isOwnProfile={isOwnProfile}
          />
        )
      }

      {/* Card Preview Modal */}
      {
        previewCard && (
          <CardPreviewModal
            open={cardPreviewOpen}
            onOpenChange={setCardPreviewOpen}
            imageUrl={previewCard.imageUrl}
            cardName={previewCard.cardName}
          />
        )
      }

      {/* User Collection Modal */}
      {
        profileData && !isOwnProfile && (
          <UserCollectionModal
            open={collectionModalOpen}
            onOpenChange={setCollectionModalOpen}
            userId={profileData.id}
            username={profileData.username}
          />
        )
      }
    </Layout >
  );
}
