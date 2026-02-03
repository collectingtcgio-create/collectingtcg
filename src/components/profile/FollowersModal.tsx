import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface FollowerUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileUsername: string;
  initialTab?: "followers" | "following" | "friends";
  isOwnProfile?: boolean;
}

export function FollowersModal({
  open,
  onOpenChange,
  profileId,
  profileUsername,
  initialTab = "followers",
  isOwnProfile = false,
}: FollowersModalProps) {
  const { profile: currentProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"followers" | "following" | "friends">(initialTab);
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [following, setFollowing] = useState<FollowerUser[]>([]);
  const [friends, setFriends] = useState<FollowerUser[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      fetchFollowers();
      fetchFollowing();
      fetchFriends();
    }
  }, [open, profileId, initialTab]);

  const fetchFollowers = async () => {
    setLoadingFollowers(true);
    const { data, error } = await supabase
      .from("followers")
      .select(`
        follower:profiles!followers_follower_id_fkey(id, username, avatar_url)
      `)
      .eq("following_id", profileId)
      .eq("status", "approved");

    if (!error && data) {
      const users = data
        .map((f) => f.follower)
        .filter((u): u is FollowerUser => u !== null);
      setFollowers(users);
    }
    setLoadingFollowers(false);
  };

  const fetchFollowing = async () => {
    setLoadingFollowing(true);
    const { data, error } = await supabase
      .from("followers")
      .select(`
        following:profiles!followers_following_id_fkey(id, username, avatar_url)
      `)
      .eq("follower_id", profileId)
      .eq("status", "approved");

    if (!error && data) {
      const users = data
        .map((f) => f.following)
        .filter((u): u is FollowerUser => u !== null);
      setFollowing(users);
    }
    setLoadingFollowing(false);
  };

  const fetchFriends = async () => {
    setLoadingFriends(true);
    
    // Fetch friendships where user is requester or addressee, and status is accepted
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        requester:profiles!friendships_requester_id_fkey(id, username, avatar_url),
        addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_url),
        requester_id,
        addressee_id
      `)
      .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`)
      .eq("status", "accepted");

    if (!error && data) {
      const users = data
        .map((f) => {
          // Return the other person in the friendship
          if (f.requester_id === profileId) {
            return f.addressee;
          } else {
            return f.requester;
          }
        })
        .filter((u): u is FollowerUser => u !== null);
      setFriends(users);
    }
    setLoadingFriends(false);
  };

  const renderUserList = (users: FollowerUser[], loading: boolean, emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="w-10 h-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {users.map((user) => (
          <Link
            key={user.id}
            to={`/profile/${user.id}`}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
              <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm hover:text-primary transition-colors">
              {user.username}
            </span>
          </Link>
        ))}
      </div>
    );
  };

  // Only show friends tab for own profile or if user can view (for now, show for all)
  const canViewFriends = isOwnProfile || currentProfile?.id === profileId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card neon-border-cyan max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {profileUsername}'s Network
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "followers" | "following" | "friends")}>
          <TabsList className={`grid w-full ${canViewFriends ? 'grid-cols-3' : 'grid-cols-2'} bg-muted/50`}>
            <TabsTrigger value="followers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Following ({following.length})
            </TabsTrigger>
            {canViewFriends && (
              <TabsTrigger value="friends" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <UserCheck className="w-3 h-3 mr-1" />
                Friends ({friends.length})
              </TabsTrigger>
            )}
          </TabsList>

          <ScrollArea className="h-[300px] mt-4">
            <TabsContent value="followers" className="mt-0">
              {renderUserList(followers, loadingFollowers, `${profileUsername} has no followers yet`)}
            </TabsContent>
            <TabsContent value="following" className="mt-0">
              {renderUserList(following, loadingFollowing, `${profileUsername} isn't following anyone yet`)}
            </TabsContent>
            {canViewFriends && (
              <TabsContent value="friends" className="mt-0">
                {renderUserList(friends, loadingFriends, `${profileUsername} has no friends yet`)}
              </TabsContent>
            )}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
