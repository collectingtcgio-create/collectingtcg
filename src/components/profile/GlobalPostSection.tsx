import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Globe, Image, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface GlobalPostSectionProps {
  isOwnProfile: boolean;
}

export function GlobalPostSection({ isOwnProfile }: GlobalPostSectionProps) {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [posting, setPosting] = useState(false);

  if (!isOwnProfile) return null;

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error("Please add some content");
      return;
    }

    if (!profile?.id) {
      toast.error("Please sign in to post");
      return;
    }

    setPosting(true);

    try {
      const { error } = await supabase.from("global_posts").insert({
        author_id: profile.id,
        content: content.trim(),
        image_url: imageUrl.trim() || null,
        video_url: null,
      });

      if (error) throw error;

      toast.success("Posted to global feed!");
      setContent("");
      setImageUrl("");
    } catch (error: any) {
      toast.error(error.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="glass-card p-4 neon-border-cyan">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        Post to Global Feed
      </h3>
      
      <Textarea
        placeholder="Share something with the world..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] resize-none mb-3"
        maxLength={500}
      />
      
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1"
          />
          {imageUrl && (
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8"
              onClick={() => setImageUrl("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {imageUrl && (
        <div className="mb-3 rounded-lg overflow-hidden inline-block">
          <img src={imageUrl} alt="Preview" className="max-h-32 rounded-lg" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </div>
      )}

      <div className="flex items-center justify-end">
        <Button
          size="sm"
          onClick={handlePost}
          disabled={posting || !content.trim()}
          className="gap-1"
        >
          {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Post
        </Button>
      </div>
    </div>
  );
}
