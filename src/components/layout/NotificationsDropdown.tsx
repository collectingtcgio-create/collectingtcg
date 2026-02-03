import { Link } from "react-router-dom";
import { Bell, Check, Trash2, ShoppingBag, DollarSign, ArrowLeftRight, CheckCircle, XCircle, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useFriendships } from "@/hooks/useFriendships";
import { formatDistanceToNow } from "date-fns";

const notificationIcons: Record<Notification['type'], React.ReactNode> = {
  purchase: <ShoppingBag className="w-4 h-4 text-green-500" />,
  offer: <DollarSign className="w-4 h-4 text-primary" />,
  counter_offer: <ArrowLeftRight className="w-4 h-4 text-yellow-500" />,
  offer_accepted: <CheckCircle className="w-4 h-4 text-green-500" />,
  offer_declined: <XCircle className="w-4 h-4 text-destructive" />,
  friend_request: <UserPlus className="w-4 h-4 text-secondary" />,
};

export function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications();
  const { pendingRequests, acceptFriendRequest, declineFriendRequest } = useFriendships();

  const totalUnread = unreadCount + pendingRequests.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground rounded-xl"
        >
          <Bell className="w-5 h-5" />
          {totalUnread > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-secondary text-secondary-foreground text-xs animate-pulse"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass-card border-border">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-foreground">Notifications</span>
          {(notifications.length > 0 || pendingRequests.length > 0) && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={(e) => {
                  e.preventDefault();
                  markAllAsRead();
                }}
              >
                <Check className="w-3 h-3 mr-1" />
                Read all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  clearAll();
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-[350px]">
          {/* Friend Requests Section */}
          {pendingRequests.length > 0 && (
            <>
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <UserPlus className="w-3 h-3" />
                  Friend Requests ({pendingRequests.length})
                </p>
              </div>
              {pendingRequests.slice(0, 3).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 bg-primary/5"
                >
                  <Link to={`/profile/${request.requester?.id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={request.requester?.avatar_url || undefined}
                        alt={request.requester?.username || "User"}
                      />
                      <AvatarFallback className="text-xs">
                        {request.requester?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${request.requester?.id}`}
                      className="font-semibold text-sm hover:text-primary truncate block"
                    >
                      {request.requester?.username || "Unknown"}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      wants to be friends
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                      onClick={() => acceptFriendRequest.mutate(request.id)}
                      disabled={acceptFriendRequest.isPending}
                    >
                      {acceptFriendRequest.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => declineFriendRequest.mutate(request.id)}
                      disabled={declineFriendRequest.isPending}
                    >
                      {declineFriendRequest.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              {pendingRequests.length > 3 && (
                <Link
                  to="/settings"
                  className="block text-center text-xs text-primary hover:underline py-2"
                >
                  View all {pendingRequests.length} requests
                </Link>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Regular Notifications */}
          {notifications.length === 0 && pendingRequests.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.read && "bg-primary/5"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="mt-0.5">
                  {notificationIcons[notification.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm",
                    !notification.read ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(notification.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
