import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
    Gift,
    ImageIcon,
    X,
    Camera,
    Link2
} from "lucide-react";
import { GiftSelector } from "@/components/gifting/GiftSelector";
import { GiftType, getGiftByType, GiftMascot } from "@/components/gifting/GiftConfig";
import { WallPost, WallPostReply, DbGiftType } from "@/types/wall";
import { useFriendshipStatus } from "@/hooks/useFriendshipStatus";

interface PostItemProps {
    post: WallPost;
    replies: WallPostReply[];
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

export function PostItem({ post, replies, currentProfile, onDeletePost, onShowGiftAnimation }: PostItemProps) {
    const { toast } = useToast();
    const [replyContent, setReplyContent] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);
    const [replyImage, setReplyImage] = useState<File | null>(null);
    const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [mediaUrl, setMediaUrl] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: friendshipStatus } = useFriendshipStatus(post.profile_id);
    const isOwner = currentProfile?.id === post.profile_id;
    const canReply = isOwner || friendshipStatus?.isFriend;
    const queryClient = useQueryClient(); // Add this to invalidate later

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
            setReplyImage(file);
            setReplyImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setReplyImage(null);
        setReplyImagePreview(null);
        setMediaUrl("");
        setShowLinkInput(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmitReply = async () => {
        if (!currentProfile || (!replyContent.trim() && !replyImage && !mediaUrl)) return;

        setSubmittingReply(true);
        let imageUrl: string | null = mediaUrl || null;

        // Upload image if present
        if (replyImage) {
            const fileExt = replyImage.name.split(".").pop();
            const fileName = `${currentProfile.id}/replies/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("wall-posts")
                .upload(fileName, replyImage);

            if (uploadError) {
                toast({
                    title: "Failed to upload image",
                    description: uploadError.message,
                    variant: "destructive",
                });
                setSubmittingReply(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from("wall-posts")
                .getPublicUrl(fileName);

            imageUrl = publicUrl;
        }

        const { error } = await supabase
            .from("wall_post_replies")
            .insert({
                post_id: post.id,
                author_id: currentProfile.id,
                content: replyContent.trim(),
                image_url: imageUrl,
            });

        if (error) {
            toast({
                title: "Failed to post reply",
                description: error.message,
                variant: "destructive",
            });
        } else {
            setReplyContent("");
            removeImage();
            queryClient.invalidateQueries({ queryKey: ["wall-replies"] });
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
            queryClient.invalidateQueries({ queryKey: ["wall-replies"] });
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
            queryClient.invalidateQueries({ queryKey: ["wall-replies"] });

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
                    {/* Reply Form - Only for friends or owner */}
                    {currentProfile && canReply && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-border">
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
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <Input
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Write a reply..."
                                            className="bg-input/50 border-border focus:border-primary/50 h-8 text-sm transition-all shadow-inner"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSubmitReply();
                                                }
                                            }}
                                        />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setShowLinkInput(false);
                                                fileInputRef.current?.click();
                                            }}
                                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                            title="Add photo"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setReplyImage(null);
                                                setReplyImagePreview(null);
                                                setShowLinkInput(!showLinkInput);
                                            }}
                                            className={`h-8 px-2 transition-colors ${showLinkInput ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
                                            title="Add Link"
                                        >
                                            <Link2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            onClick={handleSubmitReply}
                                            disabled={submittingReply || (!replyContent.trim() && !replyImage && !mediaUrl)}
                                            className="h-8 w-8 bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                                        >
                                            {submittingReply ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>

                                    {showLinkInput && (
                                        <div className="flex gap-2 animate-in slide-in-from-top-1 duration-200 mt-1">
                                            <Input
                                                placeholder="Paste image or GIF URL..."
                                                value={mediaUrl}
                                                onChange={(e) => setMediaUrl(e.target.value)}
                                                className="h-7 text-xs bg-background border-primary/20 focus:border-primary/50"
                                                autoFocus
                                            />
                                        </div>
                                    )}

                                    {/* Image/Link Preview */}
                                    {(replyImagePreview || mediaUrl) && (
                                        <div className="relative inline-block mt-1 animate-in zoom-in-95 duration-200">
                                            <img
                                                src={replyImagePreview || mediaUrl}
                                                alt="Preview"
                                                className="max-h-24 rounded-md border border-border shadow-sm"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full shadow-md"
                                                onClick={removeImage}
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!canReply && currentProfile && (
                        <div className="p-2 text-center bg-muted/20 rounded-md border border-dashed border-border/50">
                            <p className="text-xs text-muted-foreground italic">
                                Only friends can reply to this post.
                            </p>
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
                                    <p className="text-sm text-foreground/80 mb-2">{reply.content}</p>
                                    {reply.image_url && (
                                        <div className="mt-2 rounded-md overflow-hidden border border-border/50 shadow-sm max-w-[200px]">
                                            <img
                                                src={reply.image_url}
                                                alt="Reply attachment"
                                                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                                onClick={() => window.open(reply.image_url!, '_blank')}
                                            />
                                        </div>
                                    )}
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
