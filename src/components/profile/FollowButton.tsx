import { Button } from "@/components/ui/button";
import { useFollowers } from "@/hooks/useFollowers";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, UserMinus, Clock, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FollowButton({
  targetUserId,
  variant = "outline",
  size = "default",
  className,
}: FollowButtonProps) {
  const { profile } = useAuth();
  const { followUser, unfollowUser, useFollowStatus } = useFollowers();
  const { data: followStatus, isLoading: statusLoading } = useFollowStatus(targetUserId);
  const { settings: targetSettings } = usePrivacySettings(targetUserId);

  if (!profile || profile.id === targetUserId) {
    return null;
  }

  // Check if following is allowed
  const canFollow = () => {
    if (!targetSettings) return true; // Default to allowing
    if (targetSettings.follow_permission === "no_one") return false;
    return true;
  };

  const requiresApproval = targetSettings?.follow_permission === "approval_required";

  const handleClick = () => {
    if (followStatus?.isFollowing || followStatus?.isPending) {
      unfollowUser.mutate(targetUserId);
    } else if (canFollow()) {
      followUser.mutate({ userId: targetUserId, requiresApproval });
    }
  };

  const isLoading = followUser.isPending || unfollowUser.isPending || statusLoading;

  if (followStatus?.isFollowing) {
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
          <UserMinus className="w-4 h-4 mr-2" />
        )}
        Following
      </Button>
    );
  }

  if (followStatus?.isPending) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleClick}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Clock className="w-4 h-4 mr-2" />
        )}
        Pending
      </Button>
    );
  }

  if (!canFollow()) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <UserPlus className="w-4 h-4 mr-2" />
        Cannot Follow
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
      Follow
    </Button>
  );
}
