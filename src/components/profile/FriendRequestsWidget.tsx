import { Link } from "react-router-dom";
import { useFriendships } from "@/hooks/useFriendships";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check, X, UserPlus, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function FriendRequestsWidget() {
  const { pendingRequests, acceptFriendRequest, declineFriendRequest } = useFriendships();

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card neon-border-magenta">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-secondary animate-pulse" />
          Friend Requests
          <Badge className="bg-secondary text-secondary-foreground ml-auto">
            {pendingRequests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRequests.slice(0, 5).map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
          >
            <Link to={`/profile/${request.requester?.id}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={request.requester?.avatar_url || undefined}
                  alt={request.requester?.username || "User"}
                />
                <AvatarFallback>
                  {request.requester?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                to={`/profile/${request.requester?.id}`}
                className="font-medium text-sm hover:text-primary truncate block"
              >
                {request.requester?.username || "Unknown"}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                onClick={() => acceptFriendRequest.mutate(request.id)}
                disabled={acceptFriendRequest.isPending}
              >
                {acceptFriendRequest.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => declineFriendRequest.mutate(request.id)}
                disabled={declineFriendRequest.isPending}
              >
                {declineFriendRequest.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
        {pendingRequests.length > 5 && (
          <Link
            to="/settings"
            className="text-xs text-primary hover:underline block text-center"
          >
            View all {pendingRequests.length} requests
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
