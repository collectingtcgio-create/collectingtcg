import { Button } from "@/components/ui/button";
import { useFriendships } from "@/hooks/useFriendships";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, UserCheck, Clock, Loader2, Check, X, UserMinus } from "lucide-react";

interface FriendRequestButtonProps {
  targetUserId: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FriendRequestButton({
  targetUserId,
  variant = "default",
  size = "default",
  className,
}: FriendRequestButtonProps) {
  const { user, profile } = useAuth();
  const {
    getFriendshipStatus,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    isLoading: statusLoading,
  } = useFriendships();
  const { settings: targetSettings } = usePrivacySettings(targetUserId);

  // Don't show if not logged in or viewing own profile
  if (!user || profile?.id === targetUserId) {
    return null;
  }

  const status = getFriendshipStatus(targetUserId);

  const isLoading =
    sendFriendRequest.isPending ||
    acceptFriendRequest.isPending ||
    declineFriendRequest.isPending ||
    removeFriend.isPending ||
    statusLoading;

  if (statusLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  // Already friends
  if (status.isFriend) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => status.friendshipId && removeFriend.mutate(status.friendshipId)}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <UserMinus className="w-4 h-4 mr-2" />
        )}
        Unfriend
      </Button>
    );
  }

  // Pending request - current user is the RECEIVER (addressee)
  if (status.isPending && !status.isRequester && status.friendshipId) {
    return (
      <div className="flex gap-2">
        <Button
          variant="default"
          size={size}
          onClick={() => acceptFriendRequest.mutate(status.friendshipId!)}
          disabled={isLoading}
          className={className}
        >
          {acceptFriendRequest.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Check className="w-4 h-4 mr-1" />
          )}
          Accept
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={() => declineFriendRequest.mutate(status.friendshipId!)}
          disabled={declineFriendRequest.isPending}
        >
          {declineFriendRequest.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  // Pending request - current user is the SENDER (requester)
  if (status.isPending && status.isRequester) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <Clock className="w-4 h-4 mr-2" />
        Request Sent
      </Button>
    );
  }

  // Check if friend requests are allowed
  const canSendRequest = () => {
    if (!targetSettings) return true; // Default to allowing
    if (targetSettings.friend_request_permission === "no_one") return false;
    // TODO: Implement friends_of_friends check
    return true;
  };

  // Cannot send request due to privacy settings
  if (!canSendRequest()) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <UserPlus className="w-4 h-4 mr-2" />
        Cannot Add
      </Button>
    );
  }

  // Can send friend request
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => sendFriendRequest.mutate(targetUserId)}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      Add Friend
    </Button>
  );
}
