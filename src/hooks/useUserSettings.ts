import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type MessagingPrivacy = "open" | "friends_only";

export interface UserSettings {
  id: string;
  user_id: string;
  messaging_privacy: MessagingPrivacy;
  created_at: string;
  updated_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked_profile?: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export function useUserSettings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["user-settings", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default ones
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from("user_settings")
          .insert({ user_id: profile.id })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings as UserSettings;
      }

      return data as UserSettings;
    },
    enabled: !!profile?.id,
  });

  // Fetch blocked users
  const { data: blockedUsers = [], isLoading: blockedLoading } = useQuery({
    queryKey: ["blocked-users", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // First get blocked user IDs
      const { data: blocksData, error: blocksError } = await supabase
        .from("blocked_users")
        .select("*")
        .eq("blocker_id", profile.id)
        .order("created_at", { ascending: false });

      if (blocksError) throw blocksError;
      if (!blocksData || blocksData.length === 0) return [];

      // Then fetch profiles for blocked users
      const blockedIds = blocksData.map(b => b.blocked_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", blockedIds);

      // Map profiles to blocked users
      return blocksData.map(block => ({
        ...block,
        blocked_profile: profilesData?.find(p => p.id === block.blocked_id) || null,
      })) as BlockedUser[];
    },
    enabled: !!profile?.id,
  });

  // Update messaging privacy
  const updatePrivacy = useMutation({
    mutationFn: async (privacy: MessagingPrivacy) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_settings")
        .update({ messaging_privacy: privacy })
        .eq("user_id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast({
        title: "Settings updated",
        description: "Your messaging privacy has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Block a user
  const blockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("blocked_users")
        .insert({ blocker_id: profile.id, blocked_id: blockedId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      toast({
        title: "User blocked",
        description: "This user can no longer message you.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to block user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unblock a user
  const unblockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", profile.id)
        .eq("blocked_id", blockedId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      toast({
        title: "User unblocked",
        description: "This user can now message you again.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to unblock user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if a user is blocked
  const isUserBlocked = (userId: string) => {
    return blockedUsers.some((b) => b.blocked_id === userId);
  };

  return {
    settings,
    blockedUsers,
    isLoading: settingsLoading || blockedLoading,
    updatePrivacy,
    blockUser,
    unblockUser,
    isUserBlocked,
  };
}
