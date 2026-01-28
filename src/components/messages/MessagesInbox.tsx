import { useState } from "react";
import { useMessages, Conversation } from "@/hooks/useMessages";
import { MessageThread } from "./MessageThread";
import { formatDistanceToNow } from "date-fns";
import { Mail, Loader2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MessagesInbox() {
  const { conversations, isLoading } = useMessages();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <MessageThread
        partnerId={selectedConversation.partnerId}
        partnerUsername={selectedConversation.partnerUsername}
        partnerAvatar={selectedConversation.partnerAvatar}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Mail className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-1">No messages yet</h3>
        <p className="text-sm text-muted-foreground">
          Visit a profile and send a message to start chatting!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {conversations.map((conv) => (
        <button
          key={conv.partnerId}
          onClick={() => setSelectedConversation(conv)}
          className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {conv.partnerAvatar ? (
              <img
                src={conv.partnerAvatar}
                alt={conv.partnerUsername}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-medium text-lg">
                {conv.partnerUsername[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold truncate">{conv.partnerUsername}</span>
              {conv.unreadCount > 0 && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-xs px-1.5 py-0">
                  {conv.unreadCount}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {conv.lastMessage}
            </p>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
          </span>
        </button>
      ))}
    </div>
  );
}
