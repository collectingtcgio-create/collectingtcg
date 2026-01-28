import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gamepad2 } from "lucide-react";
import type { TcgGame } from "./ScanResultModal";

export const GAME_OPTIONS: { value: TcgGame | 'auto'; label: string; icon: string }[] = [
  { value: 'auto', label: 'Auto-Detect', icon: '🔍' },
  { value: 'pokemon', label: 'Pokémon', icon: '⚡' },
  { value: 'magic', label: 'Magic: The Gathering', icon: '🧙' },
  { value: 'onepiece', label: 'One Piece', icon: '🏴‍☠️' },
  { value: 'lorcana', label: 'Disney Lorcana', icon: '✨' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!', icon: '🎴' },
  { value: 'dragonball', label: 'Dragon Ball', icon: '🐉' },
  { value: 'marvel', label: 'Marvel Non-Sport', icon: '🦸' },
  { value: 'unionarena', label: 'Union Arena', icon: '⚔️' },
];

interface GameSelectorProps {
  value: TcgGame | 'auto';
  onChange: (value: TcgGame | 'auto') => void;
  disabled?: boolean;
}

export function GameSelector({ value, onChange, disabled }: GameSelectorProps) {
  return (
    <div className="glass-card p-3 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Gamepad2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Game Type</span>
      </div>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as TcgGame | 'auto')}
        disabled={disabled}
      >
        <SelectTrigger className="w-full bg-background/50 border-border/50">
          <SelectValue placeholder="Select game type..." />
        </SelectTrigger>
        <SelectContent className="bg-background border-border z-50">
          {GAME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-2">
        {value === 'auto' 
          ? 'AI will automatically detect the card type'
          : 'AI will prioritize this game type for better accuracy'}
      </p>
    </div>
  );
}
