import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, Users } from "lucide-react";

interface LiveStream {
  id: string;
  title: string;
  viewer_count: number;
  streamer: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export function ActiveStreamsWidget() {
  const { data: streams = [], isLoading } = useQuery({
    queryKey: ["active-streams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_streams")
        .select(`
          id,
          title,
          viewer_count,
          streamer:profiles!live_streams_streamer_id_fkey(id, username, avatar_url)
        `)
        .eq("is_active", true)
        .order("viewer_count", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as unknown as LiveStream[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No active streams</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {streams.map((stream) => (
        <Link
          key={stream.id}
          to={`/live/${stream.id}`}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
        >
          {/* Streamer avatar with live border */}
          <div className="w-10 h-10 rounded-full overflow-hidden live-border flex-shrink-0">
            {stream.streamer?.avatar_url ? (
              <img
                src={stream.streamer.avatar_url}
                alt={stream.streamer.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center font-medium">
                {stream.streamer?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Stream info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {stream.streamer?.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {stream.title}
            </p>
          </div>

          {/* Viewer count and live badge */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              LIVE
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {stream.viewer_count}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
