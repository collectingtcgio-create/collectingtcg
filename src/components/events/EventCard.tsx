import { Bell, BellRing, ExternalLink, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { TournamentEvent, GAME_CONFIGS, STATUS_CONFIG } from './types';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: TournamentEvent;
  isNotified: boolean;
  onToggleNotify: (eventId: string) => void;
}

export function EventCard({ event, isNotified, onToggleNotify }: EventCardProps) {
  const { user } = useAuth();
  const gameConfig = GAME_CONFIGS[event.game_type];
  const statusConfig = STATUS_CONFIG[event.status];

  const formatDateRange = () => {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    
    if (event.start_date === event.end_date) {
      return format(start, 'MMM d, yyyy');
    }
    
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
    }
    
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  return (
    <div 
      className={cn(
        "glass-card p-4 transition-all duration-300 hover:scale-[1.02]",
        "border-l-4",
        gameConfig.borderColor
      )}
      style={{ borderLeftColor: gameConfig.color }}
    >
      {/* Header with game icon and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span 
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-lg",
              gameConfig.bgColor
            )}
          >
            {gameConfig.icon}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {gameConfig.name}
          </span>
        </div>
        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", statusConfig.className)}>
          {statusConfig.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>

      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <span>{event.location}</span>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Calendar className="w-4 h-4 flex-shrink-0" />
        <span>{formatDateRange()}</span>
      </div>

      {/* Major event badge */}
      {event.is_major && (
        <div className="mb-4">
          <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
            ⭐ Major Event
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {event.external_link && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(event.external_link!, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Register
          </Button>
        )}
        
        {user && (
          <Button
            variant={isNotified ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onToggleNotify(event.id)}
            className={cn(
              "transition-all",
              isNotified && "neon-glow-magenta"
            )}
            title={isNotified ? "Remove notification" : "Notify me"}
          >
            {isNotified ? (
              <BellRing className="w-4 h-4 text-secondary" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
