import { Button } from "@/components/ui/button";
import { useFriendships } from "@/hooks/useFriendships";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, UserMinus, UserCheck, Clock, Loader2 } from "lucide-react";

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
  const { profile } = useAuth();
  const {
    getFriendshipStatus,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  } = useFriendships();
  const { settings: targetSettings } = usePrivacySettings(targetUserId);

  if (!profile || profile.id === targetUserId) {
    return null;
  }

  const status = getFriendshipStatus(targetUserId);

  // Check if friend requests are allowed
  const canSendRequest = () => {
    if (!targetSettings) return true; // Default to allowing
    if (targetSettings.friend_request_permission === "no_one") return false;
    // TODO: Implement friends_of_friends check
    return true;
  };

  const handleClick = () => {
    if (status.isFriend && status.friendshipId) {
      removeFriend.mutate(status.friendshipId);
    } else if (status.isPending && !status.isRequester && status.friendshipId) {
      acceptFriendRequest.mutate(status.friendshipId);
    } else if (!status.isPending && canSendRequest()) {
      sendFriendRequest.mutate(targetUserId);
    }
  };

  const isLoading =
    sendFriendRequest.isPending ||
    acceptFriendRequest.isPending ||
    removeFriend.isPending;

  if (status.isFriend) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <UserCheck className="w-4 h-4 mr-2" />
        )}
        Friends
      </Button>
    );
  }

  if (status.isPending) {
    if (status.isRequester) {
      return (
        <Button variant="outline" size={size} disabled className={className}>
          <Clock className="w-4 h-4 mr-2" />
          Request Sent
        </Button>
      );
    } else {
      return (
        <div className="flex gap-2">
          <Button
            variant="default"
            size={size}
            onClick={() => acceptFriendRequest.mutate(status.friendshipId!)}
            disabled={isLoading}
            className={className}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Accept"
            )}
          </Button>
          <Button
            variant="outline"
            size={size}
            onClick={() => declineFriendRequest.mutate(status.friendshipId!)}
            disabled={declineFriendRequest.isPending}
          >
            Decline
          </Button>
        </div>
      );
    }
  }

  if (!canSendRequest()) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <UserPlus className="w-4 h-4 mr-2" />
        Cannot Add
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
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
