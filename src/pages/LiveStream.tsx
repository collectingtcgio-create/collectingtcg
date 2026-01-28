import { useState, useEffect, useRef } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { GiftSelector } from "@/components/gifting/GiftSelector";
import { GiftAnimation } from "@/components/gifting/GiftAnimation";
import { getGiftByType, GiftMascot, GiftType } from "@/components/gifting/GiftConfig";
import { Video, Users, Send, ArrowLeft, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  gift_type: GiftType | null;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
}

export default function LiveStream() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [chatMessage, setChatMessage] = useState("");
  const [activeGift, setActiveGift] = useState<GiftMascot | null>(null);
  const [giftSender, setGiftSender] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch stream info
  const { data: stream, isLoading: streamLoading } = useQuery({
    queryKey: ["live-stream", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("live_streams")
        .select(`
          *,
          streamer:profiles!live_streams_streamer_id_fkey(id, username, avatar_url)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch chat messages
  const { data: chatMessages = [], refetch: refetchChat } = useQuery({
    queryKey: ["stream-chat", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("stream_chat")
        .select(`
          *,
          user:profiles!stream_chat_user_id_fkey(username, avatar_url)
        `)
        .eq("stream_id", id)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!id,
  });

  // Real-time chat subscription
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`stream-chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stream_chat",
          filter: `stream_id=eq.${id}`,
        },
        async (payload) => {
          refetchChat();
          
          // Check if it's a gift message
          const newMessage = payload.new as ChatMessage;
          if (newMessage.gift_type) {
            const gift = getGiftByType(newMessage.gift_type);
            if (gift) {
              // Fetch sender name
              const { data: senderProfile } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", newMessage.user_id)
                .single();
              
              setGiftSender(senderProfile?.username || "Someone");
              setActiveGift(gift);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetchChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !profile?.id || !id) return;

    await supabase.from("stream_chat").insert({
      stream_id: id,
      user_id: profile.id,
      content: chatMessage.trim(),
    });

    setChatMessage("");
  };

  const handleGiftSent = (giftType: GiftType) => {
    if (!id || !profile?.id) return;
    
    const gift = getGiftByType(giftType);
    if (!gift) return;
    
    // Send gift message to chat
    supabase.from("stream_chat").insert({
      stream_id: id,
      user_id: profile.id,
      content: `sent a ${gift.name}!`,
      gift_type: giftType,
    });
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      {/* Gift Animation Overlay */}
      <GiftAnimation
        gift={activeGift}
        senderName={giftSender}
        onComplete={() => setActiveGift(null)}
      />

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Main Video Area */}
          <div className="flex-1 flex flex-col">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative glass-card neon-border-cyan">
              {streamLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <>
                  {/* Placeholder for actual video stream */}
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-background">
                    <div className="text-center">
                      <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Live stream video feed</p>
                    </div>
                  </div>

                  {/* Live indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-3 py-1 rounded-full">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-semibold">LIVE</span>
                  </div>

                  {/* Viewer count */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{stream?.viewer_count || 0}</span>
                  </div>
                </>
              )}
            </div>

            {/* Stream info */}
            <div className="mt-4 glass-card neon-border-cyan p-4 rounded-xl">
              {streamLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to={`/profile/${stream?.streamer?.id}`}>
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden live-border">
                      {stream?.streamer?.avatar_url ? (
                        <img
                          src={stream.streamer.avatar_url}
                          alt={stream.streamer.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold">
                          {stream?.streamer?.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <h1 className="text-xl font-bold">{stream?.title}</h1>
                    <p className="text-muted-foreground">
                      {stream?.streamer?.username}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="w-80 flex flex-col glass-card neon-border-magenta rounded-xl overflow-hidden">
            {/* Chat header */}
            <div className="p-3 border-b border-border/50">
              <h3 className="font-semibold">Live Chat</h3>
            </div>

            {/* Chat messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {chatMessages.map((msg) => {
                  const gift = msg.gift_type ? getGiftByType(msg.gift_type) : null;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-lg ${
                        gift
                          ? 'border-2'
                          : 'bg-muted/30'
                      }`}
                      style={gift ? {
                        borderColor: gift.color,
                        boxShadow: `0 0 10px ${gift.glowColor}`,
                        backgroundColor: `${gift.glowColor}20`,
                      } : undefined}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-primary">
                          {msg.user?.username || "Anonymous"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: false })}
                        </span>
                      </div>
                      <p className="text-sm">
                        {gift && <span className="mr-1">{gift.emoji}</span>}
                        {msg.content}
                      </p>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Chat input */}
            <div className="p-3 border-t border-border/50">
              {/* Gift button */}
              {stream?.streamer?.id && stream.streamer.id !== profile?.id && (
                <div className="mb-2">
                  <GiftSelector
                    recipientId={stream.streamer.id}
                    source="live_stream"
                    sourceId={id}
                    onGiftSent={handleGiftSent}
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full border-secondary text-secondary hover:bg-secondary/20"
                      >
                        🎁 Send a Gift
                      </Button>
                    }
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="Say something..."
                  className="bg-input border-border"
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={!chatMessage.trim()}
                  size="icon"
                  className="bg-primary hover:bg-primary/80"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
