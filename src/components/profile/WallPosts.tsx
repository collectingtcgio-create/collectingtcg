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
  X,
  Link2
} from "lucide-react";
import { GiftAnimation } from "@/components/gifting/GiftAnimation";
import { GiftMascot } from "@/components/gifting/GiftConfig";
import { WallPost, WallPostReply } from "@/types/wall";
import { PostItem } from "./PostItem";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface WallPostsProps {
  profileId: string;
  profileUsername: string;
  isOwnProfile: boolean;
}

export function WallPosts({ profileId, profileUsername, isOwnProfile }: WallPostsProps) {
  const { user, profile: currentProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<GiftMascot | null>(null);
  const [giftSenderName, setGiftSenderName] = useState<string>("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch posts via React Query
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["wall-posts", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wall_posts")
        .select(`
          *,
          author:profiles!wall_posts_author_id_fkey(id, username, avatar_url)
        `)
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as unknown as WallPost[];
    },
    enabled: !!profileId,
  });

  // Fetch ALL replies for these posts in one query
  const { data: allReplies = [] } = useQuery({
    queryKey: ["wall-replies", profileId, posts.map(p => p.id)],
    queryFn: async () => {
      if (posts.length === 0) return [];

      const postIds = posts.map(p => p.id);
      const { data, error } = await supabase
        .from("wall_post_replies")
        .select(`
          *,
          author:profiles!wall_post_replies_author_id_fkey(id, username, avatar_url)
        `)
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as unknown as WallPostReply[];
    },
    enabled: posts.length > 0,
  });

  useEffect(() => {
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
          queryClient.invalidateQueries({ queryKey: ["wall-posts", profileId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wall_post_replies',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["wall-replies", profileId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, queryClient]);

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
    setMediaUrl("");
    setShowLinkInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitPost = async () => {
    if (!currentProfile || (!postContent.trim() && !postImage && !mediaUrl)) return;

    setSubmitting(true);
    let imageUrl: string | null = mediaUrl || null;

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
      queryClient.invalidateQueries({ queryKey: ["wall-posts", profileId] });
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
      queryClient.invalidateQueries({ queryKey: ["wall-posts", profileId] });
    }
  };

  const handleShowGiftAnimation = (gift: GiftMascot, senderName: string) => {
    setGiftSenderName(senderName);
    setActiveGiftAnimation(gift);
  };

  if (postsLoading) {
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

                {/* Image/Link Preview */}
                {(postImagePreview || mediaUrl) && (
                  <div className="relative inline-block">
                    <img
                      src={postImagePreview || mediaUrl}
                      alt="Preview"
                      className="max-h-40 rounded-lg border border-border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full shadow-lg"
                      onClick={removeImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {showLinkInput && (
                  <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
                    <Input
                      placeholder="Paste image or GIF URL..."
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="h-8 text-sm bg-background border-primary/20 focus:border-primary/50"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setShowLinkInput(false)}
                    >
                      Cancel
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
                      onClick={() => {
                        setShowLinkInput(false);
                        fileInputRef.current?.click();
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors h-8"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Photo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPostImage(null);
                        setPostImagePreview(null);
                        setShowLinkInput(!showLinkInput);
                      }}
                      className={`h-8 transition-colors ${showLinkInput ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Link Media
                    </Button>
                  </div>
                  <Button
                    onClick={handleSubmitPost}
                    disabled={submitting || (!postContent.trim() && !postImage && !mediaUrl)}
                    size="sm"
                    className="rounded-full bg-primary hover:bg-primary shadow-lg shadow-primary/20 transition-all font-bold px-4 h-8"
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
                replies={allReplies.filter(r => r.post_id === post.id)}
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
