import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { 
  Loader2, 
  Send, 
  MessageSquare, 
  Image as ImageIcon, 
  X, 
  Trash2,
  Gift
} from "lucide-react";
import { GiftSelector } from "@/components/gifting/GiftSelector";
import { GiftAnimation } from "@/components/gifting/GiftAnimation";
import { GiftType, getGiftByType, GIFT_MASCOTS, GiftMascot } from "@/components/gifting/GiftConfig";
import { Database } from "@/integrations/supabase/types";

type DbGiftType = Database["public"]["Enums"]["gift_type"];

interface WallPost {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  author: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

interface WallPostReply {
  id: string;
  content: string;
  created_at: string;
  gift_type: DbGiftType | null;
  author: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

interface WallPostsProps {
  profileId: string;
  profileUsername: string;
  isOwnProfile: boolean;
}

// Get glow class based on gift tier
function getGiftGlowClass(giftType: DbGiftType | null): string {
  if (!giftType) return "";
  const gift = getGiftByType(giftType as GiftType);
  if (!gift) return "";
  
  switch (gift.tier) {
    case 'bronze':
      return 'gift-glow-bronze gift-message';
    case 'silver':
      return 'gift-glow-silver gift-message';
    case 'gold':
      return 'gift-glow-gold gift-message';
    default:
      return '';
  }
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
  const [replies, setReplies] = useState<Record<string, WallPostReply[]>>({});
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
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
      
      // Fetch reply counts and replies for all posts
      postsData.forEach((post) => {
        fetchReplies(post.id);
      });
    }
    setLoading(false);
  };

  const fetchReplies = async (postId: string) => {
    const { data, error } = await supabase
      .from("wall_post_replies")
      .select(`
        *,
        author:profiles!wall_post_replies_author_id_fkey(id, username, avatar_url)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch replies:", error);
    } else {
      setReplies((prev) => ({ ...prev, [postId]: data as unknown as WallPostReply[] }));
    }
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
    let videoUrl: string | null = null;

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

  // Removed toggleReplies - replies now always shown

  const handleSubmitReply = async (postId: string) => {
    if (!currentProfile || !replyContent[postId]?.trim()) return;

    setSubmittingReply(postId);
    
    const { error } = await supabase
      .from("wall_post_replies")
      .insert({
        post_id: postId,
        author_id: currentProfile.id,
        content: replyContent[postId].trim(),
      });

    if (error) {
      toast({
        title: "Failed to post reply",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setReplyContent((prev) => ({ ...prev, [postId]: "" }));
      fetchReplies(postId);
    }
    setSubmittingReply(null);
  };

  const handleDeleteReply = async (replyId: string, postId: string) => {
    const { error } = await supabase
      .from("wall_post_replies")
      .delete()
      .eq("id", replyId);

    if (error) {
      toast({
        title: "Failed to delete reply",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchReplies(postId);
    }
  };

  const handleGiftSent = async (
    giftType: GiftType, 
    replyId: string, 
    postId: string,
    recipientUsername: string
  ) => {
    // Update the reply with the gift type
    const { error } = await supabase
      .from("wall_post_replies")
      .update({ gift_type: giftType })
      .eq("id", replyId);

    if (!error) {
      // Trigger the gift animation
      const gift = getGiftByType(giftType);
      if (gift) {
        setGiftSenderName(currentProfile?.username || "Someone");
        setActiveGiftAnimation(gift);
      }
      
      // Refresh replies to show the glow
      fetchReplies(postId);
      
      // Show notification toast
      toast({
        title: `${gift?.emoji} Gift sent!`,
        description: `You sent a ${gift?.name} to ${recipientUsername}!`,
      });
    }
  };

  const handlePostGiftSent = (giftType: GiftType, post: WallPost) => {
    // Trigger the gift animation
    const gift = getGiftByType(giftType);
    if (gift) {
      setGiftSenderName(currentProfile?.username || "Someone");
      setActiveGiftAnimation(gift);
    }
    
    // Show notification toast
    toast({
      title: `${gift?.emoji} Gift sent!`,
      description: `You sent a ${gift?.name} to ${post.author.username}!`,
    });
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
              <div
                key={post.id}
                className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Link to={`/profile/${post.author?.id}`}>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-transparent hover:ring-primary/50 transition-all">
                      {post.author?.avatar_url ? (
                        <img
                          src={post.author.avatar_url}
                          alt={post.author.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {post.author?.username?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/profile/${post.author?.id}`}
                        className="font-medium text-sm text-primary hover:underline"
                      >
                        {post.author?.username || "Unknown"}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {/* Gift button for posts - only show if not own post */}
                  {currentProfile && currentProfile.id !== post.author?.id && (
                    <GiftSelector
                      recipientId={post.author?.id}
                      source="comment_reply"
                      sourceId={post.id}
                      onGiftSent={(giftType) => handlePostGiftSent(giftType, post)}
                      size="sm"
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-secondary hover:text-secondary hover:neon-glow-magenta"
                        >
                          <Gift className="w-4 h-4" />
                        </Button>
                      }
                    />
                  )}
                  {/* Delete button for post author */}
                  {currentProfile?.id === post.author?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePost(post.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Post Content */}
                <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-3">
                  {post.content}
                </p>

                {/* Post Image */}
                {post.image_url && (
                  <div className="mb-3">
                    <img
                      src={post.image_url}
                      alt="Post image"
                      className="max-h-80 rounded-lg object-cover"
                    />
                  </div>
                )}

                {/* Post Video */}
                {post.video_url && (
                  <div className="mb-3">
                    <video
                      src={post.video_url}
                      controls
                      playsInline
                      className="max-h-[500px] max-w-full rounded-lg"
                    />
                  </div>
                )}

                {/* Replies Section - Always visible */}
                <div className="pt-2 border-t border-border/50">
                  {/* Reply count header */}
                  <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {replies[post.id]?.length || 0} {(replies[post.id]?.length || 0) === 1 ? 'Reply' : 'Replies'}
                    </span>
                  </div>

                  <div className="pl-4 border-l-2 border-border/50 space-y-3">
                    {/* Reply Form */}
                    {user && currentProfile && (
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {currentProfile.avatar_url ? (
                            <img
                              src={currentProfile.avatar_url}
                              alt={currentProfile.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium">
                              {currentProfile.username?.[0]?.toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={replyContent[post.id] || ""}
                            onChange={(e) =>
                              setReplyContent((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder="Write a reply..."
                            className="bg-input border-border h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitReply(post.id);
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            onClick={() => handleSubmitReply(post.id)}
                            disabled={submittingReply === post.id || !replyContent[post.id]?.trim()}
                            className="h-8 w-8"
                          >
                            {submittingReply === post.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies List */}
                    {replies[post.id]?.map((reply) => {
                      const giftGlowClass = getGiftGlowClass(reply.gift_type);
                      const giftInfo = reply.gift_type ? getGiftByType(reply.gift_type as GiftType) : null;
                      
                      return (
                        <div key={reply.id} className="flex gap-2 group">
                          <Link to={`/profile/${reply.author?.id}`}>
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {reply.author?.avatar_url ? (
                                <img
                                  src={reply.author.avatar_url}
                                  alt={reply.author.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-medium">
                                  {reply.author?.username?.[0]?.toUpperCase() || "?"}
                                </span>
                              )}
                            </div>
                          </Link>
                          <div className={`flex-1 bg-muted/30 rounded-lg p-2 ${giftGlowClass}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                to={`/profile/${reply.author?.id}`}
                                className="font-medium text-xs text-primary hover:underline"
                              >
                                {reply.author?.username || "Unknown"}
                              </Link>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                              </span>
                              {/* Gift badge if reply was gifted */}
                              {giftInfo && (
                                <span 
                                  className="text-xs px-1.5 py-0.5 rounded-full uppercase font-bold"
                                  style={{ 
                                    backgroundColor: giftInfo.color,
                                    color: 'black'
                                  }}
                                >
                                  {giftInfo.emoji} {giftInfo.tier}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground/80">{reply.content}</p>
                          </div>
                          
                          {/* Actions for reply */}
                          <div className="flex items-center gap-1">
                            {/* Gift button - only show for other users' replies */}
                            {currentProfile && currentProfile.id !== reply.author?.id && !reply.gift_type && (
                              <GiftSelector
                                recipientId={reply.author?.id}
                                source="comment_reply"
                                sourceId={reply.id}
                                onGiftSent={(giftType) => 
                                  handleGiftSent(giftType, reply.id, post.id, reply.author?.username || "Unknown")
                                }
                                size="sm"
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-secondary hover:text-secondary hover:bg-secondary/10"
                                  >
                                    <Gift className="w-4 h-4" />
                                  </Button>
                                }
                              />
                            )}
                            {/* Delete button for reply author */}
                            {currentProfile?.id === reply.author?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteReply(reply.id, post.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {(!replies[post.id] || replies[post.id].length === 0) && (
                      <p className="text-xs text-muted-foreground">No replies yet. Be the first to comment!</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
