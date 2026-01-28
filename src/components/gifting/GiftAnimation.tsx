import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { GiftMascot, getTierColor } from "./GiftConfig";

interface GiftAnimationProps {
  gift: GiftMascot | null;
  senderName?: string;
  onComplete: () => void;
}

export function GiftAnimation({ gift, senderName, onComplete }: GiftAnimationProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    if (gift) {
      // Generate random particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);

      // Auto-dismiss after animation
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [gift, onComplete]);

  if (!gift) return null;

  const tierColor = getTierColor(gift.tier);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at center, ${gift.glowColor} 0%, transparent 70%)`,
        }}
      >
        {/* Particle explosion */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full"
            style={{ backgroundColor: gift.color }}
            initial={{
              x: "50vw",
              y: "50vh",
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: particle.delay,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Central gift mascot */}
        <motion.div
          className="absolute flex flex-col items-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: [0, 1.5, 1], rotate: [0, 360] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Glow ring */}
          <motion.div
            className="absolute w-48 h-48 rounded-full"
            style={{
              border: `4px solid ${tierColor}`,
              boxShadow: `0 0 40px ${gift.glowColor}, 0 0 80px ${gift.glowColor}`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Emoji mascot */}
          <motion.span
            className="text-8xl relative z-10"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {gift.emoji}
          </motion.span>

          {/* Gift name and sender */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2
              className="text-3xl font-bold"
              style={{ color: gift.color, textShadow: `0 0 20px ${gift.glowColor}` }}
            >
              {gift.name}
            </h2>
            {senderName && (
              <p className="text-lg text-foreground/80 mt-2">
                from <span className="font-semibold text-primary">{senderName}</span>
              </p>
            )}
            <p
              className="text-sm mt-1 uppercase tracking-wider"
              style={{ color: tierColor }}
            >
              {gift.tier} tier • {gift.element}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
