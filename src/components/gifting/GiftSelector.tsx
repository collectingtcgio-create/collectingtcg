import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GIFT_MASCOTS, GiftType, getTierColor } from "./GiftConfig";
import { Gift, Coins } from "lucide-react";
import { useGifting } from "@/hooks/useGifting";

interface GiftSelectorProps {
  recipientId: string;
  source: 'live_stream' | 'comment_reply' | 'direct_message';
  sourceId?: string;
  onGiftSent?: (giftType: GiftType) => void;
  trigger?: React.ReactNode;
  size?: 'sm' | 'default';
}

export function GiftSelector({
  recipientId,
  source,
  sourceId,
  onGiftSent,
  trigger,
  size = 'default',
}: GiftSelectorProps) {
  const [open, setOpen] = useState(false);
  const { wallet, sendGift } = useGifting();

  const handleSendGift = async (giftType: GiftType) => {
    try {
      await sendGift.mutateAsync({
        recipientId,
        giftType,
        source,
        sourceId,
      });
      setOpen(false);
      onGiftSent?.(giftType);
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size={size === 'sm' ? 'icon' : 'default'}
            className={`text-secondary hover:text-secondary hover:neon-glow-magenta ${
              size === 'sm' ? 'w-8 h-8' : ''
            }`}
          >
            <Gift className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5 mr-2'} />
            {size !== 'sm' && 'Send Gift'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-card neon-border-magenta max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-secondary">
            <Gift className="w-5 h-5" />
            Send a Gift
          </DialogTitle>
        </DialogHeader>

        {/* Wallet balance */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-4">
          <span className="text-muted-foreground">Your Credits</span>
          <span className="flex items-center gap-2 font-bold text-primary">
            <Coins className="w-4 h-4" />
            {wallet?.eco_credits || 0}
          </span>
        </div>

        {/* Gift grid */}
        <div className="grid grid-cols-2 gap-3">
          {GIFT_MASCOTS.map((gift) => {
            const canAfford = (wallet?.eco_credits || 0) >= gift.creditCost;
            const tierColor = getTierColor(gift.tier);

            return (
              <motion.button
                key={gift.id}
                whileHover={{ scale: canAfford ? 1.05 : 1 }}
                whileTap={{ scale: canAfford ? 0.95 : 1 }}
                onClick={() => canAfford && handleSendGift(gift.id)}
                disabled={!canAfford || sendGift.isPending}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  canAfford
                    ? 'hover:shadow-lg cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  borderColor: canAfford ? gift.color : 'hsl(var(--border))',
                  boxShadow: canAfford ? `0 0 15px ${gift.glowColor}` : 'none',
                }}
              >
                {/* Tier badge */}
                <span
                  className="absolute top-2 right-2 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: tierColor, color: 'black' }}
                >
                  {gift.tier}
                </span>

                <span className="text-4xl block mb-2">{gift.emoji}</span>
                <h4 className="font-semibold text-sm">{gift.name}</h4>
                <p className="text-xs text-muted-foreground">{gift.element}</p>
                <div className="flex items-center justify-center gap-1 mt-2 text-sm font-bold" style={{ color: gift.color }}>
                  <Coins className="w-3 h-3" />
                  {gift.creditCost}
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          50% goes to the creator, 50% supports the platform
        </p>
      </DialogContent>
    </Dialog>
  );
}
