import { TcgEventGame, GAME_CONFIGS } from './types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventFiltersProps {
  selectedGames: TcgEventGame[];
  onToggleGame: (game: TcgEventGame) => void;
  className?: string;
}

export function EventFilters({ selectedGames, onToggleGame, className }: EventFiltersProps) {
  const games = Object.values(GAME_CONFIGS);

  return (
    <div className={cn("glass-card p-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Filter by Game</h3>
      </div>
      
      <div className="space-y-3">
        {games.map((game) => {
          const isSelected = selectedGames.length === 0 || selectedGames.includes(game.id);
          
          return (
            <div key={game.id} className="flex items-center gap-3">
              <Checkbox
                id={`filter-${game.id}`}
                checked={isSelected}
                onCheckedChange={() => onToggleGame(game.id)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor={`filter-${game.id}`}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <span 
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center text-sm",
                    game.bgColor
                  )}
                >
                  {game.icon}
                </span>
                <span className={cn(!isSelected && "text-muted-foreground")}>
                  {game.name}
                </span>
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
