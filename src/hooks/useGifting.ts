import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GiftType, getGiftByType, calculateGiftSplit } from "@/components/gifting/GiftConfig";

export function useGifting() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's wallet
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["user-wallet", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      
      // Create wallet if doesn't exist
      if (!data) {
        const { data: newWallet, error: createError } = await supabase
          .from("user_wallets")
          .insert({ user_id: profile.id })
          .select()
          .single();
        
        if (createError) throw createError;
        return newWallet;
      }
      
      return data;
    },
    enabled: !!profile?.id,
  });

  // Send a gift
  const sendGift = useMutation({
    mutationFn: async ({
      recipientId,
      giftType,
      source,
      sourceId,
    }: {
      recipientId: string;
      giftType: GiftType;
      source: 'live_stream' | 'comment_reply' | 'direct_message';
      sourceId?: string;
    }) => {
      if (!profile?.id) throw new Error("Not authenticated");
      if (!wallet) throw new Error("Wallet not found");

      const gift = getGiftByType(giftType);
      if (!gift) throw new Error("Invalid gift type");

      if (wallet.eco_credits < gift.creditCost) {
        throw new Error("Insufficient credits");
      }

      const split = calculateGiftSplit(gift.creditCost);

      // Deduct credits from sender
      const { error: deductError } = await supabase
        .from("user_wallets")
        .update({ eco_credits: wallet.eco_credits - gift.creditCost })
        .eq("user_id", profile.id);

      if (deductError) throw deductError;

      // Get or create recipient wallet
      let recipientWallet = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", recipientId)
        .maybeSingle();

      if (!recipientWallet.data) {
        await supabase
          .from("user_wallets")
          .insert({ user_id: recipientId });
        
        recipientWallet = await supabase
          .from("user_wallets")
          .select("*")
          .eq("user_id", recipientId)
          .single();
      }

      // Add earned balance to recipient (RLS will handle this via edge function in production)
      // For now, we just log the transaction

      // Log the transaction
      const { error: txError } = await supabase
        .from("gift_transactions")
        .insert({
          sender_id: profile.id,
          recipient_id: recipientId,
          gift_type: giftType,
          source,
          source_id: sourceId,
          credit_amount: gift.creditCost,
          recipient_earned: split.recipientEarned,
          platform_revenue: split.platformRevenue,
        });

      if (txError) throw txError;

      return { gift, split };
    },
    onSuccess: ({ gift }) => {
      queryClient.invalidateQueries({ queryKey: ["user-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["gift-transactions"] });
      toast({
        title: `${gift.emoji} Gift Sent!`,
        description: `You sent a ${gift.name}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send gift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    wallet,
    walletLoading,
    sendGift,
  };
}
