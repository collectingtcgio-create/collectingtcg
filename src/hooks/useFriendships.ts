import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type FriendshipStatus = "pending" | "accepted" | "declined";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    username: string;
    avatar_url: string;
  };
  addressee?: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export function useFriendships() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all friendships (both sent and received)
  const { data: friendships = [], isLoading } = useQuery({
    queryKey: ["friendships", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("friendships")
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey(id, username, avatar_url),
          addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_url)
        `)
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Friendship[];
    },
    enabled: !!profile?.id,
  });

  // Get accepted friends
  const friends = friendships
    .filter((f) => f.status === "accepted")
    .map((f) => (f.requester_id === profile?.id ? f.addressee : f.requester))
    .filter(Boolean);

  // Get pending friend requests (received)
  const pendingRequests = friendships.filter(
    (f) => f.status === "pending" && f.addressee_id === profile?.id
  );

  // Get sent friend requests
  const sentRequests = friendships.filter(
    (f) => f.status === "pending" && f.requester_id === profile?.id
  );

  // Send friend request
  const sendFriendRequest = useMutation({
    mutationFn: async (addresseeId: string) => {
      if (!profile?.id) {
        console.error("[useFriendships] Cannot send request: Profile record missing", { profile });
        throw new Error("Unable to authenticate. Your profile record might be missing. Please try refreshing the page.");
      }

      const { error } = await supabase.from("friendships").insert({
        requester_id: profile.id,
        addressee_id: addresseeId,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendships"] });
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept friend request
  const acceptFriendRequest = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendships"] });
      toast({
        title: "Friend request accepted",
        description: "You are now friends!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Decline friend request
  const declineFriendRequest = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("id", friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendships"] });
      toast({
        title: "Friend request declined",
        description: "The request has been declined.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to decline request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove friend
  const removeFriend = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendships"] });
      toast({
        title: "Friend removed",
        description: "This person has been removed from your friends.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove friend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check friendship status with a specific user
  const getFriendshipStatus = (userId: string): { isFriend: boolean; isPending: boolean; friendshipId?: string; isRequester?: boolean } => {
    const friendship = friendships.find(
      (f) =>
        (f.requester_id === userId || f.addressee_id === userId) &&
        (f.requester_id === profile?.id || f.addressee_id === profile?.id)
    );

    if (!friendship) {
      return { isFriend: false, isPending: false };
    }

    return {
      isFriend: friendship.status === "accepted",
      isPending: friendship.status === "pending",
      friendshipId: friendship.id,
      isRequester: friendship.requester_id === profile?.id,
    };
  };

  return {
    friendships,
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    getFriendshipStatus,
  };
}
