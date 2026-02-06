import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
    Loader2,
    Send,
    MessageSquare,
    Trash2,
    Gift
} from "lucide-react";
import { GiftSelector } from "@/components/gifting/GiftSelector";
import { GiftType, getGiftByType, GiftMascot } from "@/components/gifting/GiftConfig";
import { WallPost, WallPostReply, DbGiftType } from "@/types/wall";

interface PostItemProps {
    post: WallPost;
    currentProfile: any; // Using any for now to avoid extensive type imports, simpler refactor
    onDeletePost: (postId: string) => void;
    onShowGiftAnimation: (gift: GiftMascot, senderName: string) => void;
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

export function PostItem({ post, currentProfile, onDeletePost, onShowGiftAnimation }: PostItemProps) {
    const { toast } = useToast();
    const [replies, setReplies] = useState<WallPostReply[]>([]);
    const [replyContent, setReplyContent] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);

    useEffect(() => {
        fetchReplies();
    }, [post.id]);

    const fetchReplies = async () => {
        const { data, error } = await supabase
            .from("wall_post_replies")
            .select(`
        *,
        author:profiles!wall_post_replies_author_id_fkey(id, username, avatar_url)
      `)
            .eq("post_id", post.id)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Failed to fetch replies:", error);
        } else {
            setReplies(data as unknown as WallPostReply[]);
        }
    };

    const handleSubmitReply = async () => {
        if (!currentProfile || !replyContent.trim()) return;

        setSubmittingReply(true);

        const { error } = await supabase
            .from("wall_post_replies")
            .insert({
                post_id: post.id,
                author_id: currentProfile.id,
                content: replyContent.trim(),
            });

        if (error) {
            toast({
                title: "Failed to post reply",
                description: error.message,
                variant: "destructive",
            });
        } else {
            setReplyContent("");
            fetchReplies();
        }
        setSubmittingReply(false);
    };

    const handleDeleteReply = async (replyId: string) => {
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
            fetchReplies();
        }
    };

    const handlePostGiftSent = (giftType: GiftType) => {
        const gift = getGiftByType(giftType);
        if (gift) {
            onShowGiftAnimation(gift, currentProfile?.username || "Someone");

            toast({
                title: `${gift?.emoji} Gift sent!`,
                description: `You sent a ${gift?.name} to ${post.author.username}!`,
            });
        }
    };

    const handleReplyGiftSent = async (
        giftType: GiftType,
        replyId: string,
        recipientUsername: string
    ) => {
        // Update the reply with the gift type
        const { error } = await supabase
            .from("wall_post_replies")
            .update({ gift_type: giftType })
            .eq("id", replyId);

        if (!error) {
            const gift = getGiftByType(giftType);
            if (gift) {
                onShowGiftAnimation(gift, currentProfile?.username || "Someone");
            }

            // Refresh replies to show the glow
            fetchReplies();

            toast({
                title: `${gift?.emoji} Gift sent!`,
                description: `You sent a ${gift?.name} to ${recipientUsername}!`,
            });
        }
    };

    return (
        <div className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
                        onGiftSent={handlePostGiftSent}
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
                        onClick={() => onDeletePost(post.id)}
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
                        {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                    </span>
                </div>

                <div className="pl-4 border-l-2 border-border/50 space-y-3">
                    {/* Reply Form */}
                    {currentProfile && (
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
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="bg-input border-border h-8 text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmitReply();
                                        }
                                    }}
                                />
                                <Button
                                    size="icon"
                                    onClick={handleSubmitReply}
                                    disabled={submittingReply || !replyContent.trim()}
                                    className="h-8 w-8"
                                >
                                    {submittingReply ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Replies List */}
                    {replies.map((reply) => {
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
                                                handleReplyGiftSent(giftType, reply.id, reply.author?.username || "Unknown")
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
                                            onClick={() => handleDeleteReply(reply.id)}
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {replies.length === 0 && (
                        <p className="text-xs text-muted-foreground">No replies yet. Be the first to comment!</p>
                    )}
                </div>
            </div>
        </div>
    );
}
