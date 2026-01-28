import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Package, ArrowRightLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

// TCG game colors
const TCG_COLORS: Record<string, string> = {
  pokemon: 'bg-yellow-500/20 text-yellow-400',
  magic: 'bg-purple-500/20 text-purple-400',
  yugioh: 'bg-orange-500/20 text-orange-400',
  onepiece: 'bg-red-500/20 text-red-400',
  lorcana: 'bg-blue-500/20 text-blue-400',
  dragonball: 'bg-orange-600/20 text-orange-300',
  marvel: 'bg-red-600/20 text-red-300',
  unionarena: 'bg-green-500/20 text-green-400',
};

interface TraderProfileSidebarProps {
  partnerId: string;
  partnerUsername: string;
  partnerAvatar: string;
  onCreateTrade: () => void;
}

export function TraderProfileSidebar({
  partnerId,
  partnerUsername,
  partnerAvatar,
  onCreateTrade,
}: TraderProfileSidebarProps) {
  // Fetch wants
  const { data: wants = [], isLoading: wantsLoading } = useQuery({
    queryKey: ["user-wants", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_wants")
        .select("*")
        .eq("user_id", partnerId)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  // Fetch haves
  const { data: haves = [], isLoading: havesLoading } = useQuery({
    queryKey: ["user-haves", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_haves")
        .select("*")
        .eq("user_id", partnerId)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Profile header */}
      <div className="p-4 border-b border-border/50 text-center">
        <Link to={`/profile/${partnerId}`}>
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-2 overflow-hidden hover:ring-2 hover:ring-primary transition-all">
            {partnerAvatar ? (
              <img
                src={partnerAvatar}
                alt={partnerUsername}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                {partnerUsername[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </Link>
        <h3 className="font-semibold text-lg">{partnerUsername}</h3>
        <Link
          to={`/profile/${partnerId}`}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          View Profile <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Wants section */}
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-secondary">
              <Heart className="w-4 h-4" />
              Wants ({wants.length})
            </h4>
            {wantsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : wants.length === 0 ? (
              <p className="text-xs text-muted-foreground">No wants listed</p>
            ) : (
              <div className="space-y-2">
                {wants.map((want) => (
                  <div
                    key={want.id}
                    className="p-2 bg-muted/30 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${TCG_COLORS[want.tcg_game] || ''}`}
                      >
                        {want.tcg_game}
                      </Badge>
                    </div>
                    <p className="font-medium truncate">{want.card_name}</p>
                    {want.max_price && (
                      <p className="text-xs text-muted-foreground">
                        Max: ${want.max_price}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Haves section */}
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-primary">
              <Package className="w-4 h-4" />
              Haves ({haves.length})
            </h4>
            {havesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : haves.length === 0 ? (
              <p className="text-xs text-muted-foreground">No cards for trade</p>
            ) : (
              <div className="space-y-2">
                {haves.map((have) => (
                  <div
                    key={have.id}
                    className="p-2 bg-muted/30 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${TCG_COLORS[have.tcg_game] || ''}`}
                      >
                        {have.tcg_game}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {have.condition?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="font-medium truncate">{have.card_name}</p>
                    {have.asking_price && (
                      <p className="text-xs text-primary">
                        ${have.asking_price}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Create Trade button */}
      <div className="p-4 border-t border-border/50">
        <Button
          onClick={onCreateTrade}
          className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground neon-glow-magenta"
        >
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Create Trade
        </Button>
      </div>
    </div>
  );
}
