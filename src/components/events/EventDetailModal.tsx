import { format } from 'date-fns';
import { Bell, BellRing, ExternalLink, MapPin, Calendar, Star, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TournamentEvent, GAME_CONFIGS, STATUS_CONFIG } from './types';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface EventDetailModalProps {
  event: TournamentEvent | null;
  isOpen: boolean;
  onClose: () => void;
  isNotified: boolean;
  onToggleNotify: (eventId: string) => void;
}

export function EventDetailModal({ 
  event, 
  isOpen, 
  onClose, 
  isNotified, 
  onToggleNotify 
}: EventDetailModalProps) {
  const { user } = useAuth();
  
  if (!event) return null;

  const gameConfig = GAME_CONFIGS[event.game_type];
  const statusConfig = STATUS_CONFIG[event.status];

  const formatDateRange = () => {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    
    if (event.start_date === event.end_date) {
      return format(start, 'EEEE, MMMM d, yyyy');
    }
    
    return `${format(start, 'EEEE, MMMM d')} - ${format(end, 'EEEE, MMMM d, yyyy')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <span 
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                gameConfig.bgColor
              )}
            >
              {gameConfig.icon}
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{gameConfig.name}</p>
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div>
            <span className={cn("text-sm px-3 py-1 rounded-full font-medium", statusConfig.className)}>
              {statusConfig.label}
            </span>
            {event.is_major && (
              <span className="ml-2 text-sm px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                <Star className="w-3 h-3 inline mr-1" />
                Major Event
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <MapPin className="w-5 h-5 flex-shrink-0 text-primary" />
            <span>{event.location}</span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="w-5 h-5 flex-shrink-0 text-primary" />
            <span>{formatDateRange()}</span>
          </div>

          {/* Description */}
          {event.description && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {event.external_link && (
              <Button
                className="flex-1"
                onClick={() => window.open(event.external_link!, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Register Now
              </Button>
            )}
            
            {user && (
              <Button
                variant={isNotified ? "secondary" : "outline"}
                onClick={() => onToggleNotify(event.id)}
                className={cn(isNotified && "neon-glow-magenta")}
              >
                {isNotified ? (
                  <>
                    <BellRing className="w-4 h-4 mr-2" />
                    Notified
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Notify Me
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
