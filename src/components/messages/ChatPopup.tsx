import { useState, useEffect } from "react";
import { useMessages, Conversation } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { MessageThread } from "./MessageThread";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, X, Minimize2, ChevronUp, Badge as BadgeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatPopup() {
  const { user } = useAuth();
  const { conversations, unreadCount } = useMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [previousUnread, setPreviousUnread] = useState(0);

  // Auto-open when new message arrives
  useEffect(() => {
    if (unreadCount > previousUnread && !isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    }
    setPreviousUnread(unreadCount);
  }, [unreadCount, previousUnread, isOpen]);

  if (!user) return null;

  const handleClose = () => {
    setIsOpen(false);
    setActiveChat(null);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:neon-glow-cyan transition-all duration-300 flex items-center justify-center group"
      >
        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-6 right-4 z-50 w-80 glass-card neon-border-cyan overflow-hidden shadow-2xl transition-all duration-300",
        isMinimized ? "h-12" : "h-96"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-primary/20 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">
            {activeChat ? activeChat.partnerUsername : "Messages"}
          </span>
          {!activeChat && unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 hover:bg-primary/20"
            onClick={handleMinimize}
          >
            {isMinimized ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 hover:bg-destructive/20 hover:text-destructive"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="h-[calc(100%-48px)] overflow-hidden">
          {activeChat ? (
            <MessageThread
              partnerId={activeChat.partnerId}
              partnerUsername={activeChat.partnerUsername}
              partnerAvatar={activeChat.partnerAvatar}
              onBack={() => setActiveChat(null)}
              compact
            />
          ) : (
            <div className="h-full overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <MessageCircle className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No messages yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {conversations.map((conv) => (
                    <button
                      key={conv.partnerId}
                      onClick={() => setActiveChat(conv)}
                      className="w-full flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {conv.partnerAvatar ? (
                          <img
                            src={conv.partnerAvatar}
                            alt={conv.partnerUsername}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-medium text-sm">
                            {conv.partnerUsername[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-medium text-sm truncate">
                            {conv.partnerUsername}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), {
                          addSuffix: false,
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
