import { useState } from "react";
import { useMessages, Conversation } from "@/hooks/useMessages";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MessageSquare } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

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
