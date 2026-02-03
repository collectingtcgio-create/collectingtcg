import { useState, useRef, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Send, 
  Loader2, 
  User,
  DollarSign,
  Check,
  X,
  RefreshCw,
  ShoppingCart,
  MoreVertical,
  Ban,
  UserX,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ListingMessage, MessageType } from "@/hooks/useListingOffers";

interface ListingChatProps {
  messages: ListingMessage[];
  currentUserId: string | undefined;
  recipientId: string;
  recipientUsername: string;
  onSendMessage: (content: string, recipientId: string) => void;
  isSending: boolean;
  isLoading: boolean;
  isBlocked?: boolean;
  hasBlockedOther?: boolean;
  onBlockUser?: () => void;
  onUnblockUser?: () => void;
  isBlockingUser?: boolean;
}

const getMessageTypeIcon = (type: MessageType) => {
  switch (type) {
    case 'offer_sent':
      return <DollarSign className="w-4 h-4" />;
    case 'counter_sent':
      return <RefreshCw className="w-4 h-4" />;
    case 'offer_accepted':
      return <Check className="w-4 h-4" />;
    case 'offer_declined':
      return <X className="w-4 h-4" />;
    case 'buy_now':
      return <ShoppingCart className="w-4 h-4" />;
    default:
      return null;
  }
};

const getMessageTypeStyle = (type: MessageType) => {
  switch (type) {
    case 'offer_sent':
      return 'bg-primary/20 border-primary/50 text-primary';
    case 'counter_sent':
      return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    case 'offer_accepted':
      return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
    case 'offer_declined':
      return 'bg-destructive/20 border-destructive/50 text-destructive';
    case 'buy_now':
      return 'bg-secondary/20 border-secondary/50 text-secondary';
    default:
      return '';
  }
};

export const ListingChat = forwardRef<HTMLDivElement, ListingChatProps>(({
  messages,
  currentUserId,
  recipientId,
  recipientUsername,
  onSendMessage,
  isSending,
  isLoading,
  isBlocked = false,
  hasBlockedOther = false,
  onBlockUser,
  onUnblockUser,
  isBlockingUser = false,
}, ref) => {
  const [messageText, setMessageText] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText.trim(), recipientId);
    setMessageText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBlockConfirm = () => {
    onBlockUser?.();
    setShowBlockDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Blocked state
  if (isBlocked) {
    return (
      <div ref={ref} className="flex flex-col items-center justify-center h-48 text-center">
        <Ban className="w-10 h-10 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">You have been blocked by this user</p>
        <p className="text-xs text-muted-foreground mt-1">You cannot send messages to them</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col h-80 border border-border rounded-lg bg-background/30">
      {/* Chat Header */}
      <div className="px-4 py-2 border-b border-border bg-background/50 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Chat with {recipientUsername}
        </span>
        
        {/* Chat Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border-border">
            {hasBlockedOther ? (
              <DropdownMenuItem 
                onClick={onUnblockUser}
                disabled={isBlockingUser}
                className="text-foreground"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Unblock User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => setShowBlockDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <UserX className="w-4 h-4 mr-2" />
                Block User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Blocked Other State */}
      {hasBlockedOther ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Ban className="w-10 h-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">You have blocked this user</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">Unblock them to continue the conversation</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onUnblockUser}
            disabled={isBlockingUser}
          >
            {isBlockingUser ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ShieldCheck className="w-4 h-4 mr-2" />
            )}
            Unblock
          </Button>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                No messages yet. Start a conversation!
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOwn = message.sender_id === currentUserId;
                  const isSystemMessage = message.message_type !== 'text';

                  if (isSystemMessage) {
                    return (
                      <div 
                        key={message.id} 
                        className="flex justify-center"
                      >
                        <div 
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium",
                            getMessageTypeStyle(message.message_type)
                          )}
                        >
                          {getMessageTypeIcon(message.message_type)}
                          <span>{message.content}</span>
                          <span className="text-[10px] opacity-70">
                            {format(new Date(message.created_at), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={message.id}
                      className={cn(
                        "flex gap-2 max-w-[85%]",
                        isOwn ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarImage src={message.sender_profile?.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className={cn(
                          "rounded-2xl px-3 py-2 text-sm",
                          isOwn 
                            ? "bg-primary text-primary-foreground rounded-br-sm" 
                            : "bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        <p className="break-words">{message.content}</p>
                        <p className={cn(
                          "text-[10px] mt-1",
                          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {format(new Date(message.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          {currentUserId && (
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-background/50"
                  maxLength={500}
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageText.trim() || isSending}
                  size="icon"
                  className="bg-primary hover:bg-primary/80"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Block Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Block this user?</AlertDialogTitle>
            <AlertDialogDescription>
              Blocking {recipientUsername} will prevent them from messaging you. 
              You can unblock them at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockConfirm}
              className="bg-destructive hover:bg-destructive/80"
            >
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

ListingChat.displayName = 'ListingChat';