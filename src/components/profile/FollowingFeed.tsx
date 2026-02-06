import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { GiftAnimation } from "@/components/gifting/GiftAnimation";
import { GiftMascot } from "@/components/gifting/GiftConfig";
import { WallPost } from "@/types/wall";
import { PostItem } from "./PostItem";
import { useToast } from "@/hooks/use-toast";

export function FollowingFeed() {
    const { profile: currentProfile } = useAuth();
    const { toast } = useToast();

    const [posts, setPosts] = useState<WallPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeGiftAnimation, setActiveGiftAnimation] = useState<GiftMascot | null>(null);
    const [giftSenderName, setGiftSenderName] = useState<string>("");

    useEffect(() => {
        if (currentProfile) {
            fetchFeed();
        }
    }, [currentProfile]);

    const fetchFeed = async () => {
        if (!currentProfile) return;
        setLoading(true);

        try {
            // 1. Get list of user IDs that I follow
            const { data: following, error: followingError } = await supabase
                .from("followers")
                .select("following_id")
                .eq("follower_id", currentProfile.id)
                .eq("status", "approved");

            if (followingError) throw followingError;

            const followingIds = following.map(f => f.following_id);

            // If following no one, empty feed
            if (followingIds.length === 0) {
                setPosts([]);
                setLoading(false);
                return;
            }

            // 2. Fetch posts where author_id is in followingIds
            // Limit to 50 for now
            const { data: postsData, error: postsError } = await supabase
                .from("wall_posts")
                .select(`
          *,
          author:profiles!wall_posts_author_id_fkey(id, username, avatar_url)
        `)
                .in("author_id", followingIds)
                .order("created_at", { ascending: false })
                .limit(50);

            if (postsError) throw postsError;

            setPosts(postsData as unknown as WallPost[]);
        } catch (error) {
            console.error("Error fetching feed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        // Only allow if I am the author (which effectively means I follow myself? or if I see my own post in feed?)
        // In FollowingFeed, usually you see others' posts.
        // If I see my own post, I can delete it.

        // Note: The PostItem only shows delete button if currentProfile is author.
        // So this function is called only if I am the author.

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
            fetchFeed();
        }
    };

    const handleShowGiftAnimation = (gift: GiftMascot, senderName: string) => {
        setGiftSenderName(senderName);
        setActiveGiftAnimation(gift);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/20 rounded-lg border border-border/50">
                <p className="text-muted-foreground mb-2">Your feed is empty.</p>
                <p className="text-sm text-muted-foreground">Follow more collectors to see their posts here!</p>
            </div>
        );
    }

    return (
        <>
            <GiftAnimation
                gift={activeGiftAnimation}
                senderName={giftSenderName}
                onComplete={() => setActiveGiftAnimation(null)}
            />

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
        </>
    );
}
