import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// The creator user ID - this is the site owner
const CREATOR_USER_ID = "a24a29cb-576a-422b-b219-f0aadc1901e4";

interface CreatorBadgeProps {
  userId: string;
  className?: string;
}

export function CreatorBadge({ userId, className = "" }: CreatorBadgeProps) {
  if (userId !== CREATOR_USER_ID) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center justify-center ${className}`}>
          {/* Custom golden mystical fruit badge - inspired by anime power fruits but distinct */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]"
          >
            {/* Outer glow effect */}
            <defs>
              <radialGradient id="goldGradient" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFE066" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B8860B" />
              </radialGradient>
              <radialGradient id="innerShine" cx="30%" cy="20%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Main fruit body with swirl pattern */}
            <ellipse 
              cx="12" 
              cy="13" 
              rx="8" 
              ry="9" 
              fill="url(#goldGradient)"
              filter="url(#glow)"
            />
            
            {/* Swirl patterns on fruit - mystical energy lines */}
            <path
              d="M8 10 Q12 8 14 12 Q16 16 12 17"
              stroke="#B8860B"
              strokeWidth="1.2"
              fill="none"
              opacity="0.8"
            />
            <path
              d="M10 9 Q14 11 13 15"
              stroke="#B8860B"
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M16 11 Q14 14 11 15"
              stroke="#B8860B"
              strokeWidth="0.8"
              fill="none"
              opacity="0.5"
            />
            
            {/* Shine overlay */}
            <ellipse 
              cx="9" 
              cy="10" 
              rx="3" 
              ry="4" 
              fill="url(#innerShine)"
            />
            
            {/* Stem */}
            <path
              d="M12 4 L12 6 Q11 5 10 4 M12 4 Q13 5 14 4"
              stroke="#228B22"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Small leaves */}
            <path
              d="M10 4 Q8 3 9 2 Q10 3 10 4"
              fill="#32CD32"
            />
            <path
              d="M14 4 Q16 3 15 2 Q14 3 14 4"
              fill="#32CD32"
            />
            
            {/* Star sparkle for mystical effect */}
            <path
              d="M18 7 L18.5 8 L19.5 8 L18.7 8.6 L19 9.5 L18 9 L17 9.5 L17.3 8.6 L16.5 8 L17.5 8 Z"
              fill="#FFD700"
              opacity="0.9"
            />
          </svg>
        </span>
      </TooltipTrigger>
      <TooltipContent className="bg-gradient-to-r from-yellow-900/90 to-amber-900/90 border-yellow-500/50">
        <p className="font-semibold text-yellow-300">✨ Site Creator</p>
        <p className="text-xs text-yellow-200/80">The legendary founder</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function isCreator(userId: string): boolean {
  return userId === CREATOR_USER_ID;
}

export { CREATOR_USER_ID };
