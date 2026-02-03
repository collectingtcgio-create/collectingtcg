import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, DollarSign, Bot } from "lucide-react";
import { GiftSelector } from "@/components/gifting/GiftSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SYSTEM_SENDER_NAME } from "@/lib/systemMessages";

// Check if a message is a system message
const isSystemMessage = (content: string) => content.startsWith('[SYSTEM]');
const getSystemMessageContent = (content: string) => content.replace('[SYSTEM] ', '');

interface EnhancedMessageThreadProps {
  partnerId: string;
  partnerUsername: string;
  partnerAvatar: string;
}

export function EnhancedMessageThread({
  partnerId,
  partnerUsername,
  partnerAvatar,
}: EnhancedMessageThreadProps) {
  const { profile } = useAuth();
  const { getConversation, sendMessage, markAsRead } = useMessages();
  const [newMessage, setNewMessage] = useState("");
  const [priceQuery, setPriceQuery] = useState("");
  const [priceOpen, setPriceOpen] = useState(false);
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

  const insertPriceReference = () => {
    if (priceQuery.trim()) {
      setNewMessage((prev) => 
        prev + (prev ? '\n' : '') + `💰 Checking market price for: "${priceQuery}"`
      );
      setPriceQuery("");
      setPriceOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
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
        <span className="font-semibold flex-1">{partnerUsername}</span>
        
        {/* Gift button */}
        <GiftSelector
          recipientId={partnerId}
          source="direct_message"
          size="sm"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === profile?.id;
            const isSystem = isSystemMessage(msg.content);
            const displayContent = isSystem ? getSystemMessageContent(msg.content) : msg.content;
            
            // System messages get special styling
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="max-w-[85%] rounded-xl px-4 py-3 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Bot className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <span className="text-xs font-semibold text-primary">{SYSTEM_SENDER_NAME}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words text-foreground">
                      {displayContent}
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            }
            
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-4">
        <div className="flex gap-2 items-end">
          {/* Market Price Lookup */}
          <Dialog open={priceOpen} onOpenChange={setPriceOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-primary/20 flex-shrink-0"
                title="Market Price Lookup"
              >
                <DollarSign className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card neon-border-cyan">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Market Price Lookup
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={priceQuery}
                  onChange={(e) => setPriceQuery(e.target.value)}
                  placeholder="Enter card name..."
                  className="bg-input border-border"
                />
                <Button
                  onClick={insertPriceReference}
                  disabled={!priceQuery.trim()}
                  className="w-full"
                >
                  Insert Price Reference
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="bg-input border-border resize-none min-h-[44px] max-h-[120px] flex-1"
            rows={1}
          />
          
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
            size="icon"
            className="rounded-full bg-primary hover:bg-primary/80 hover:neon-glow-cyan flex-shrink-0"
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
