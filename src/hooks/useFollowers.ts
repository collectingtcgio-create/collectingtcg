import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type FollowStatus = "pending" | "approved";

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  status: FollowStatus;
  created_at: string;
  follower?: {
    id: string;
    username: string;
    avatar_url: string;
  };
  following?: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export function useFollowers(targetProfileId?: string) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileId = targetProfileId || profile?.id;

  // Fetch followers of a profile
  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: ["followers", profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from("followers")
        .select(`
          *,
          follower:profiles!followers_follower_id_fkey(id, username, avatar_url)
        `)
        .eq("following_id", profileId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Follower[];
    },
    enabled: !!profileId,
  });

  // Fetch users that a profile is following
  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: ["following", profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const { data, error } = await supabase
        .from("followers")
        .select(`
          *,
          following:profiles!followers_following_id_fkey(id, username, avatar_url)
        `)
        .eq("follower_id", profileId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Follower[];
    },
    enabled: !!profileId,
  });

  // Fetch pending follow requests (for approval_required mode)
  const { data: pendingFollowRequests = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-follow-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("followers")
        .select(`
          *,
          follower:profiles!followers_follower_id_fkey(id, username, avatar_url)
        `)
        .eq("following_id", profile.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Follower[];
    },
    enabled: !!profile?.id,
  });

  // Follow a user
  const followUser = useMutation({
    mutationFn: async ({ userId, requiresApproval = false }: { userId: string; requiresApproval?: boolean }) => {
      let currentProfile = profile;

      if (!currentProfile?.id) {
        console.warn("[useFollowers] Profile missing, attempting refresh...");
        currentProfile = await refreshProfile();
      }

      if (!currentProfile?.id) {
        console.error("[useFollowers] Cannot follow: Profile record missing after refresh");
        throw new Error("Unable to authenticate. Your profile record might be missing. Please try refreshing the page.");
      }

      const { error } = await supabase.from("followers").insert({
        follower_id: currentProfile.id,
        following_id: userId,
        status: requiresApproval ? "pending" : "approved",
      });

      if (error) throw error;
    },
    onSuccess: (_, { requiresApproval }) => {
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["follow-status"] });
      toast({
        title: requiresApproval ? "Follow request sent" : "Following",
        description: requiresApproval
          ? "Your follow request has been sent for approval."
          : "You are now following this user.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to follow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unfollow a user
  const unfollowUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", profile.id)
        .eq("following_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["follow-status"] });
      toast({
        title: "Unfollowed",
        description: "You are no longer following this user.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to unfollow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve a follow request
  const approveFollowRequest = useMutation({
    mutationFn: async (followId: string) => {
      const { error } = await supabase
        .from("followers")
        .update({ status: "approved" })
        .eq("id", followId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["pending-follow-requests"] });
      toast({
        title: "Follow request approved",
        description: "This user can now follow you.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to approve",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject a follow request or remove a follower
  const removeFollower = useMutation({
    mutationFn: async (followId: string) => {
      const { error } = await supabase.from("followers").delete().eq("id", followId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["pending-follow-requests"] });
      toast({
        title: "Follower removed",
        description: "This user has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check follow status with a specific user
  const useFollowStatus = (userId: string) => {
    return useQuery({
      queryKey: ["follow-status", profile?.id, userId],
      queryFn: async () => {
        if (!profile?.id || !userId) return { isFollowing: false, isPending: false };

        const { data } = await supabase
          .from("followers")
          .select("id, status")
          .eq("follower_id", profile.id)
          .eq("following_id", userId)
          .maybeSingle();

        return {
          isFollowing: data?.status === "approved",
          isPending: data?.status === "pending",
          followId: data?.id,
        };
      },
      enabled: !!profile?.id && !!userId,
    });
  };

  return {
    followers,
    following,
    pendingFollowRequests,
    isLoading: followersLoading || followingLoading || pendingLoading,
    followUser,
    unfollowUser,
    approveFollowRequest,
    removeFollower,
    useFollowStatus,
    followerCount: followers.length,
    followingCount: following.length,
  };
}
