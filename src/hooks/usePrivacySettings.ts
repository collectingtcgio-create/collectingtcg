import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type ProfileVisibility = "public" | "friends_only" | "private";
export type FriendRequestPermission = "everyone" | "friends_of_friends" | "no_one";
export type FollowPermission = "everyone" | "approval_required" | "no_one";

export interface PrivacySettings {
  id: string;
  user_id: string;
  profile_visibility: ProfileVisibility;
  show_online_status: boolean;
  friend_request_permission: FriendRequestPermission;
  follow_permission: FollowPermission;
  messaging_privacy: "open" | "friends_only";
  created_at: string;
  updated_at: string;
}

export function usePrivacySettings(targetUserId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userId = targetUserId || profile?.id;

  // Fetch privacy settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["privacy-settings", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist and it's the current user, create default ones
      if (!data && userId === profile?.id) {
        const { data: newSettings, error: insertError } = await supabase
          .from("user_settings")
          .insert({ user_id: userId })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings as PrivacySettings;
      }

      return data as PrivacySettings | null;
    },
    enabled: !!userId,
  });

  // Update profile visibility
  const updateProfileVisibility = useMutation({
    mutationFn: async (visibility: ProfileVisibility) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_settings")
        .update({ profile_visibility: visibility })
        .eq("user_id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["privacy-settings"] });
      toast({
        title: "Settings updated",
        description: "Your profile visibility has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update online status visibility
  const updateOnlineStatusVisibility = useMutation({
    mutationFn: async (showOnlineStatus: boolean) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_settings")
        .update({ show_online_status: showOnlineStatus })
        .eq("user_id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["privacy-settings"] });
      toast({
        title: "Settings updated",
        description: "Your online status visibility has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update friend request permission
  const updateFriendRequestPermission = useMutation({
    mutationFn: async (permission: FriendRequestPermission) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_settings")
        .update({ friend_request_permission: permission })
        .eq("user_id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["privacy-settings"] });
      toast({
        title: "Settings updated",
        description: "Your friend request settings have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update follow permission
  const updateFollowPermission = useMutation({
    mutationFn: async (permission: FollowPermission) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_settings")
        .update({ follow_permission: permission })
        .eq("user_id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["privacy-settings"] });
      toast({
        title: "Settings updated",
        description: "Your follow settings have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    settings,
    isLoading,
    updateProfileVisibility,
    updateOnlineStatusVisibility,
    updateFriendRequestPermission,
    updateFollowPermission,
  };
}
