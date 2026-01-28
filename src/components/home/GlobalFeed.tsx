import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Globe, Users, Image, Video, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface GlobalPost {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_live: boolean;
  };
}

interface GlobalFeedProps {
  compact?: boolean;
}

export function GlobalFeed({ compact = false }: GlobalFeedProps) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<GlobalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"global" | "followers">("global");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    if (profile?.id) {
      fetchFollowing();
    }

    // Subscribe to realtime updates
    const channel = supabase
      .channel("global-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "global_posts" },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchFollowing = async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", profile.id);

    if (data) {
      setFollowingIds(data.map((f) => f.following_id));
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("global_posts")
      .select("*, profiles(id, username, avatar_url, is_live)")
      .order("created_at", { ascending: false })
      .limit(compact ? 10 : 50);

    if (data && !error) {
      setPosts(data as unknown as GlobalPost[]);
    }
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Clear video if image is selected
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
      // Clear image if video is selected
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

      // Upload image if present
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

      // Upload video if present
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

      // Create post
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

  const filteredPosts = activeTab === "followers" 
    ? posts.filter((p) => followingIds.includes(p.author_id))
    : posts;

  return (
    <div className={`glass-card neon-border-cyan h-full flex flex-col ${compact ? "p-4" : "p-6"}`}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "global" | "followers")} className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`font-semibold flex items-center gap-2 ${compact ? "text-base" : "text-lg"}`}>
            <Globe className="w-5 h-5 text-primary" />
            Global Feed
          </h2>
          <TabsList className="h-8">
            <TabsTrigger value="global" className="text-xs px-3 gap-1">
              <Globe className="w-3 h-3" />
              Global
            </TabsTrigger>
            <TabsTrigger value="followers" className="text-xs px-3 gap-1">
              <Users className="w-3 h-3" />
              Following
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Post composer */}
        {user && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="What's happening?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[60px] resize-none bg-transparent border-none focus-visible:ring-0 p-0 text-sm"
                  maxLength={500}
                />
                
                {/* Media preview */}
                {(imagePreview || videoPreview) && (
                  <div className="relative mt-2 rounded-lg overflow-hidden">
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
                    )}
                    {videoPreview && (
                      <video src={videoPreview} className="max-h-40 rounded-lg" controls />
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

                <div className="flex items-center justify-between mt-2">
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
            </div>
          </div>
        )}

        <TabsContent value={activeTab} className="flex-1 overflow-auto mt-0 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded w-1/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground text-sm">
                {activeTab === "followers" 
                  ? "No posts from people you follow" 
                  : "No posts yet. Be the first!"}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex gap-3">
                  <Link to={`/profile/${post.profiles.id}`}>
                    <Avatar className={`w-8 h-8 ${post.profiles.is_live ? "ring-2 ring-secondary animate-pulse" : ""}`}>
                      <AvatarImage src={post.profiles.avatar_url || ""} />
                      <AvatarFallback>{post.profiles.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link 
                        to={`/profile/${post.profiles.id}`}
                        className="font-medium text-sm hover:text-primary transition-colors"
                      >
                        {post.profiles.username}
                      </Link>
                      {post.profiles.is_live && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-secondary/20 text-secondary rounded-full">
                          LIVE
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{post.content}</p>
                    
                    {post.image_url && (
                      <img 
                        src={post.image_url} 
                        alt="Post image" 
                        className="mt-2 rounded-lg max-h-60 object-cover"
                      />
                    )}
                    {post.video_url && (
                      <video 
                        src={post.video_url} 
                        controls 
                        className="mt-2 rounded-lg max-h-60"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
