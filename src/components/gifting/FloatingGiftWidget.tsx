import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GIFT_MASCOTS, getTierColor } from "./GiftConfig";
import { Gift, Coins, X, ShoppingCart } from "lucide-react";
import { useGifting } from "@/hooks/useGifting";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export function FloatingGiftWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { wallet, walletLoading } = useGifting();
  const { user } = useAuth();

  // Don't show if user is not logged in
  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-24 md:bottom-6 right-4 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-primary shadow-lg hover:shadow-xl transition-all"
          style={{
            boxShadow: "0 0 20px rgba(255, 0, 255, 0.4), 0 0 40px rgba(0, 255, 255, 0.2)",
          }}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Gift className="w-6 h-6" />
          )}
        </Button>
        
        {/* Credit badge */}
        {!isOpen && (
          <Badge 
            className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-0.5 text-xs font-bold"
          >
            <Coins className="w-3 h-3 mr-1" />
            {walletLoading ? "..." : wallet?.eco_credits || 0}
          </Badge>
        )}
      </motion.div>

      {/* Popup Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-44 md:bottom-24 right-4 z-50 w-80 max-h-[70vh] overflow-auto rounded-xl border border-border bg-card shadow-2xl"
            style={{
              boxShadow: "0 0 30px rgba(255, 0, 255, 0.2), 0 0 60px rgba(0, 255, 255, 0.1)",
            }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-secondary" />
                  Gift Shop
                </h3>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="font-bold">{wallet?.eco_credits || 0}</span>
                </div>
              </div>
            </div>

            {/* Mascot Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {GIFT_MASCOTS.map((gift) => {
                const tierColor = getTierColor(gift.tier);
                
                return (
                  <motion.div
                    key={gift.id}
                    whileHover={{ scale: 1.03 }}
                    className="relative p-3 rounded-xl border-2 bg-muted/30 transition-all"
                    style={{
                      borderColor: gift.color,
                      boxShadow: `0 0 10px ${gift.glowColor}`,
                    }}
                  >
                    {/* Tier badge */}
                    <span
                      className="absolute top-1 right-1 text-[9px] uppercase font-bold px-1 py-0.5 rounded"
                      style={{ backgroundColor: tierColor, color: 'black' }}
                    >
                      {gift.tier}
                    </span>

                    <span className="text-3xl block mb-1">{gift.emoji}</span>
                    <h4 className="font-semibold text-xs">{gift.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{gift.element}</p>
                    <div 
                      className="flex items-center gap-1 mt-1 text-xs font-bold" 
                      style={{ color: gift.color }}
                    >
                      <Coins className="w-3 h-3" />
                      {gift.creditCost}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Buy Credits CTA */}
            <div className="sticky bottom-0 bg-card/95 backdrop-blur p-4 border-t border-border">
              <Button 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                onClick={() => {
                  // TODO: Open credit purchase modal
                  alert("Credit purchase coming soon! For now, credits can be added via the admin dashboard.");
                }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy Eco-Credits
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Send gifts on posts & live streams!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
