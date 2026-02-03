import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ONLINE_THRESHOLD_MINUTES = 5;
const HEARTBEAT_INTERVAL_MS = 60000; // 1 minute

export function useOnlineStatus() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Update last_seen_at and is_online
  const updatePresence = useCallback(async () => {
    if (!profile?.id) return;

    await supabase
      .from("profiles")
      .update({
        last_seen_at: new Date().toISOString(),
        is_online: true,
      })
      .eq("id", profile.id);
  }, [profile?.id]);

  // Set offline when leaving
  const setOffline = useCallback(async () => {
    if (!profile?.id) return;

    await supabase
      .from("profiles")
      .update({ is_online: false })
      .eq("id", profile.id);
  }, [profile?.id]);

  // Heartbeat to keep online status
  useEffect(() => {
    if (!profile?.id) return;

    // Initial presence update
    updatePresence();

    // Set up heartbeat
    const interval = setInterval(updatePresence, HEARTBEAT_INTERVAL_MS);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        updatePresence();
      }
    };

    // Handle before unload
    const handleBeforeUnload = () => {
      setOffline();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setOffline();
    };
  }, [profile?.id, updatePresence, setOffline]);

  return { updatePresence, setOffline };
}

export function useUserOnlineStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ["online-status", userId],
    queryFn: async () => {
      if (!userId) return { isOnline: false, lastSeen: null };

      const { data } = await supabase
        .from("profiles")
        .select("is_online, last_seen_at")
        .eq("id", userId)
        .single();

      if (!data) return { isOnline: false, lastSeen: null };

      // Check if last_seen_at is within threshold
      const lastSeen = data.last_seen_at ? new Date(data.last_seen_at) : null;
      const now = new Date();
      const isRecentlyActive = lastSeen
        ? now.getTime() - lastSeen.getTime() < ONLINE_THRESHOLD_MINUTES * 60 * 1000
        : false;

      return {
        isOnline: data.is_online && isRecentlyActive,
        lastSeen,
      };
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
