import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMessages, Message } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, ArrowLeft } from "lucide-react";

interface MessageThreadProps {
  partnerId: string;
  partnerUsername: string;
  partnerAvatar: string;
  onBack: () => void;
  compact?: boolean;
}

export function MessageThread({
  partnerId,
  partnerUsername,
  partnerAvatar,
  onBack,
  compact = false,
}: MessageThreadProps) {
  const { profile } = useAuth();
  const { getConversation, sendMessage, markAsRead } = useMessages();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = getConversation(partnerId);

  // Mark messages as read when viewing
  useEffect(() => {
    markAsRead.mutate(partnerId);
  }, [partnerId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    await sendMessage.mutateAsync({
      recipientId: partnerId,
      content: newMessage.trim(),
    });

    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - only show in non-compact or when we need back */}
      {!compact && (
        <div className="flex items-center gap-3 p-4 border-b border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {partnerAvatar ? (
              <img
                src={partnerAvatar}
                alt={partnerUsername}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-medium">
                {partnerUsername[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <span className="font-semibold">{partnerUsername}</span>
        </div>
      )}
      {compact && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="w-6 h-6"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {partnerAvatar ? (
              <img
                src={partnerAvatar}
                alt={partnerUsername}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium">
                {partnerUsername[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-sm font-medium truncate">{partnerUsername}</span>
        </div>
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto space-y-3 ${compact ? "p-2" : "p-4"}`}>
        {messages.map((msg) => {
          const isOwn = msg.sender_id === profile?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl ${compact ? "px-3 py-1.5" : "px-4 py-2"} ${
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}
              >
                <p className={`${compact ? "text-xs" : "text-sm"} whitespace-pre-wrap break-words`}>
                  {msg.content}
                </p>
                <p
                  className={`${compact ? "text-[10px]" : "text-xs"} mt-0.5 ${
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {formatDistanceToNow(new Date(msg.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`border-t border-border/50 ${compact ? "p-2" : "p-4"}`}>
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={`bg-input border-border resize-none ${compact ? "min-h-[36px] text-sm" : "min-h-[44px]"} max-h-[120px]`}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
            size="icon"
            className={`rounded-full bg-primary hover:bg-primary/80 hover:neon-glow-cyan flex-shrink-0 ${compact ? "w-9 h-9" : ""}`}
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
