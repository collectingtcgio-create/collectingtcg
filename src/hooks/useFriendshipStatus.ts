import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type FriendshipStatus = "pending" | "accepted" | "declined";

export function useFriendshipStatus(targetUserId: string) {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ["friendship-status", profile?.id, targetUserId],
        queryFn: async () => {
            if (!profile?.id || !targetUserId || profile.id === targetUserId) {
                return { isFriend: false, isPending: false, friendshipId: undefined, isRequester: false };
            }

            const { data, error } = await supabase
                .from("friendships")
                .select("id, requester_id, addressee_id, status")
                .or(`and(requester_id.eq.${profile.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${profile.id})`)
                .maybeSingle();

            if (error) {
                console.error("Error fetching friendship status:", error);
                return { isFriend: false, isPending: false, friendshipId: undefined, isRequester: false };
            }

            if (!data) {
                return { isFriend: false, isPending: false, friendshipId: undefined, isRequester: false };
            }

            return {
                isFriend: data.status === "accepted",
                isPending: data.status === "pending",
                friendshipId: data.id,
                isRequester: data.requester_id === profile.id,
                status: data.status as FriendshipStatus,
            };
        },
        enabled: !!profile?.id && !!targetUserId && profile.id !== targetUserId,
    });
}
