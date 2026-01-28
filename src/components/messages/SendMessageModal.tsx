import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/hooks/useMessages";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientUsername: string;
}

export function SendMessageModal({
  open,
  onOpenChange,
  recipientId,
  recipientUsername,
}: SendMessageModalProps) {
  const [content, setContent] = useState("");
  const { sendMessage } = useMessages();
  const { toast } = useToast();

  const handleSend = async () => {
    if (!content.trim()) return;

    await sendMessage.mutateAsync({
      recipientId,
      content: content.trim(),
    });

    toast({
      title: "Message sent!",
      description: `Your message to ${recipientUsername} has been delivered.`,
    });

    setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Send Message to {recipientUsername}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            className="bg-input border-border min-h-[120px] resize-none"
            maxLength={1000}
          />

          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {content.length}/1000
            </span>
            <Button
              onClick={handleSend}
              disabled={!content.trim() || sendMessage.isPending}
              className="rounded-full bg-primary hover:bg-primary/80 hover:neon-glow-cyan"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
