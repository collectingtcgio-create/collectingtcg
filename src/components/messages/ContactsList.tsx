import { useState } from "react";
import { Link } from "react-router-dom";
import { useMessages, Conversation } from "@/hooks/useMessages";
import { useFriendships } from "@/hooks/useFriendships";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageSquare, UserPlus, Check, X, Bell, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// TCG game type colors
const TCG_COLORS: Record<string, string> = {
  pokemon: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  magic: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  yugioh: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  onepiece: 'bg-red-500/20 text-red-400 border-red-500/50',
  lorcana: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  dragonball: 'bg-orange-600/20 text-orange-300 border-orange-600/50',
  marvel: 'bg-red-600/20 text-red-300 border-red-600/50',
};

interface ContactsListProps {
  onSelectContact: (conversation: Conversation) => void;
  selectedPartnerId?: string;
}

export function ContactsList({ onSelectContact, selectedPartnerId }: ContactsListProps) {
  const { conversations, isLoading } = useMessages();
  const { pendingRequests, acceptFriendRequest, declineFriendRequest } = useFriendships();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFriendRequests, setShowFriendRequests] = useState(true);

  const filteredConversations = conversations.filter((conv) =>
    conv.partnerUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="pl-9 bg-input border-border"
          />
        </div>
      </div>

      {/* Friend Requests Section */}
      {pendingRequests.length > 0 && showFriendRequests && (
        <div className="border-b border-border/50">
          <button
            onClick={() => setShowFriendRequests(!showFriendRequests)}
            className="w-full flex items-center justify-between px-3 py-2 bg-secondary/10 hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-secondary animate-pulse" />
              <span className="text-sm font-semibold text-secondary">Friend Requests</span>
            </div>
            <Badge className="bg-secondary text-secondary-foreground text-xs">
              {pendingRequests.length}
            </Badge>
          </button>
          
          <div className="max-h-40 overflow-y-auto">
            {pendingRequests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-2 p-2 px-3 bg-muted/20 border-b border-border/20"
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
                    className="font-medium text-xs hover:text-primary truncate block"
                  >
                    {request.requester?.username || "Unknown"}
                  </Link>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-green-500 hover:text-green-400 hover:bg-green-500/10"
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
                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => declineFriendRequest.mutate(request.id)}
                    disabled={declineFriendRequest.isPending}
                  >
                    {declineFriendRequest.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            {pendingRequests.length > 3 && (
              <Link
                to="/settings"
                className="block text-center text-xs text-primary hover:underline py-2 bg-muted/10"
              >
                View all {pendingRequests.length} requests
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No contacts found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.partnerId}
              onClick={() => onSelectContact(conv)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left border-b border-border/30 ${
                selectedPartnerId === conv.partnerId ? 'bg-muted/50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {conv.partnerAvatar ? (
                  <img
                    src={conv.partnerAvatar}
                    alt={conv.partnerUsername}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-medium">
                    {conv.partnerUsername[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm truncate">
                    {conv.partnerUsername}
                  </span>
                  {conv.unreadCount > 0 && (
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-xs px-1.5 py-0 h-5">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.lastMessage.startsWith('[SYSTEM]') 
                    ? `🤖 ${conv.lastMessage.replace('[SYSTEM] ', '').slice(0, 50)}...`
                    : conv.lastMessage}
                </p>
              </div>

              {/* Time */}
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
