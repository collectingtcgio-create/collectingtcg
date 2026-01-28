import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Globe, Image, Video, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface GlobalPostSectionProps {
  isOwnProfile: boolean;
}

export function GlobalPostSection({ isOwnProfile }: GlobalPostSectionProps) {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOwnProfile) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setVideoFile(null);
      setVideoPreview(null);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video must be less than 50MB");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const clearMedia = () => {
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handlePost = async () => {
    if (!content.trim() && !imageFile && !videoFile) {
      toast.error("Please add some content");
      return;
    }

    if (!profile?.id) {
      toast.error("Please sign in to post");
      return;
    }

    setPosting(true);

    try {
      let imageUrl = null;
      let videoUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("wall-posts")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("wall-posts")
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      if (videoFile) {
        const fileExt = videoFile.name.split(".").pop();
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("wall-posts")
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("wall-posts")
          .getPublicUrl(fileName);
        
        videoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("global_posts").insert({
        author_id: profile.id,
        content: content.trim(),
        image_url: imageUrl,
        video_url: videoUrl,
      });

      if (error) throw error;

      toast.success("Posted to global feed!");
      setContent("");
      clearMedia();
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
      
      {(imagePreview || videoPreview) && (
        <div className="relative mb-3 rounded-lg overflow-hidden inline-block">
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
          )}
          {videoPreview && (
            <video src={videoPreview} className="max-h-32 rounded-lg" controls />
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 w-6 h-6"
            onClick={clearMedia}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8"
            onClick={() => imageInputRef.current?.click()}
          >
            <Image className="w-4 h-4" />
          </Button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoSelect}
          />
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8"
            onClick={() => videoInputRef.current?.click()}
          >
            <Video className="w-4 h-4" />
          </Button>
        </div>
        <Button
          size="sm"
          onClick={handlePost}
          disabled={posting || (!content.trim() && !imageFile && !videoFile)}
          className="gap-1"
        >
          {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Post
        </Button>
      </div>
    </div>
  );
}
