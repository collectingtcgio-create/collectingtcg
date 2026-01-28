import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Radio, Loader2 } from "lucide-react";

interface StartStreamModalProps {
  trigger?: React.ReactNode;
}

export function StartStreamModal({ trigger }: StartStreamModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const startStream = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");
      if (!title.trim()) throw new Error("Title is required");

      // Update profile is_live status
      await supabase
        .from("profiles")
        .update({ is_live: true })
        .eq("id", profile.id);

      // Create stream record
      const { data, error } = await supabase
        .from("live_streams")
        .insert({
          streamer_id: profile.id,
          title: title.trim(),
          description: description.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (stream) => {
      queryClient.invalidateQueries({ queryKey: ["live-streams"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "You're Live!",
        description: "Your stream has started.",
      });
      setOpen(false);
      navigate(`/live/${stream.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to start stream",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-destructive hover:bg-destructive/80 text-destructive-foreground pulse-live">
            <Radio className="w-4 h-4 mr-2" />
            Go Live
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-card neon-border-magenta">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-secondary">
            <Radio className="w-5 h-5" />
            Start Live Stream
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-1 block">
              Stream Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you streaming today?"
              className="bg-input border-border"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what to expect..."
              className="bg-input border-border resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={() => startStream.mutate()}
            disabled={!title.trim() || startStream.isPending}
            className="w-full bg-destructive hover:bg-destructive/80 text-destructive-foreground"
          >
            {startStream.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Radio className="w-4 h-4 mr-2" />
            )}
            Start Streaming
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
