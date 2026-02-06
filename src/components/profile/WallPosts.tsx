import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  Send,
  ImageIcon,
  X
} from "lucide-react";
import { GiftAnimation } from "@/components/gifting/GiftAnimation";
import { GiftMascot } from "@/components/gifting/GiftConfig";
import { WallPost } from "@/types/wall";
import { PostItem } from "./PostItem";

interface WallPostsProps {
  profileId: string;
  profileUsername: string;
  isOwnProfile: boolean;
}

export function WallPosts({ profileId, profileUsername, isOwnProfile }: WallPostsProps) {
  const { user, profile: currentProfile } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<GiftMascot | null>(null);
  const [giftSenderName, setGiftSenderName] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('wall-posts-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wall_posts',
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("wall_posts")
      .select(`
        *,
        author:profiles!wall_posts_author_id_fkey(id, username, avatar_url)
      `)
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to fetch posts:", error);
    } else {
      const postsData = data as unknown as WallPost[];
      setPosts(postsData);
    }
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      setPostImage(file);
      setPostImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setPostImage(null);
    setPostImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitPost = async () => {
    if (!currentProfile || !postContent.trim()) return;

    setSubmitting(true);
    let imageUrl: string | null = null;

    // Upload image if present
    if (postImage) {
      const fileExt = postImage.name.split(".").pop();
      const fileName = `${currentProfile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("wall-posts")
        .upload(fileName, postImage);

      if (uploadError) {
        toast({
          title: "Failed to upload image",
          description: uploadError.message,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("wall-posts")
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    const { error } = await supabase
      .from("wall_posts")
      .insert({
        profile_id: profileId,
        author_id: currentProfile.id,
        content: postContent.trim(),
        image_url: imageUrl,
        video_url: null,
      });

    if (error) {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Post published!",
      });
      setPostContent("");
      removeImage();
      fetchPosts();
    }
    setSubmitting(false);
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from("wall_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast({
        title: "Failed to delete post",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchPosts();
    }
  };

  const handleShowGiftAnimation = (gift: GiftMascot, senderName: string) => {
    setGiftSenderName(senderName);
    setActiveGiftAnimation(gift);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Gift Animation Overlay */}
      <GiftAnimation
        gift={activeGiftAnimation}
        senderName={giftSenderName}
        onComplete={() => setActiveGiftAnimation(null)}
      />

      <div className="space-y-4">
        {/* Create Post Form - Only for profile owner */}
        {isOwnProfile && user && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {currentProfile?.avatar_url ? (
                  <img
                    src={currentProfile.avatar_url}
                    alt={currentProfile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {currentProfile?.username?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="bg-input border-border resize-none"
                  rows={3}
                />

                {/* Image Preview */}
                {postImagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={postImagePreview}
                      alt="Preview"
                      className="max-h-40 rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={removeImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Photo
                    </Button>
                  </div>
                  <Button
                    onClick={handleSubmitPost}
                    disabled={submitting || !postContent.trim()}
                    size="sm"
                    className="rounded-full bg-primary hover:bg-primary/80"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts List */}
        {posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {isOwnProfile
              ? "Share your first post!"
              : `${profileUsername} hasn't posted anything yet.`}
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                currentProfile={currentProfile}
                onDeletePost={handleDeletePost}
                onShowGiftAnimation={handleShowGiftAnimation}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
