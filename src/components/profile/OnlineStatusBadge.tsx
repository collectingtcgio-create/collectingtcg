import { useUserOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface OnlineStatusBadgeProps {
  userId: string;
  showLastSeen?: boolean;
  className?: string;
}

export function OnlineStatusBadge({
  userId,
  showLastSeen = false,
  className,
}: OnlineStatusBadgeProps) {
  const { data: status, isLoading } = useUserOnlineStatus(userId);
  const { settings } = usePrivacySettings(userId);

  // Don't show if user has disabled online status visibility
  if (settings && !settings.show_online_status) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  if (status?.isOnline) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
        </span>
        <span className="text-xs text-accent font-medium">Online</span>
      </div>
    );
  }

  if (showLastSeen && status?.lastSeen) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50"></span>
        <span className="text-xs text-muted-foreground">
          Last seen {formatDistanceToNow(status.lastSeen, { addSuffix: true })}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50"></span>
      <span className="text-xs text-muted-foreground">Offline</span>
    </div>
  );
}
