import { useState } from 'react';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { TcgEventGame, TournamentEvent, GAME_CONFIGS, STATUS_CONFIG } from './types';
import { EventDetailModal } from './EventDetailModal';
import { useTournamentEvents } from '@/hooks/useTournamentEvents';
import { cn } from '@/lib/utils';

export function EventsCalendarCompact() {
  const [selectedGames] = useState<TcgEventGame[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TournamentEvent | null>(null);

  const { events, loading, notifications, toggleNotification } = useTournamentEvents(selectedGames);

  // Get only the next 6 upcoming events
  const upcomingEvents = events
    .filter(event => !isBefore(parseISO(event.end_date), startOfDay(new Date())))
    .slice(0, 6);

  const handleToggleNotify = async (eventId: string) => {
    await toggleNotification(eventId);
  };

  return (
    <div className="glass-card p-4 neon-border-cyan">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Upcoming Events
        </h2>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
          <a href="#events-full">View All</a>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : upcomingEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
      ) : (
        <div className="space-y-2">
          {upcomingEvents.map(event => {
            const gameConfig = GAME_CONFIGS[event.game_type];
            const statusConfig = STATUS_CONFIG[event.status];
            
            return (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={cn(
                  "w-full text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all",
                  "border-l-2 flex items-center gap-3"
                )}
                style={{ borderLeftColor: gameConfig.color }}
              >
                <span 
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center text-sm flex-shrink-0",
                    gameConfig.bgColor
                  )}
                >
                  {gameConfig.icon}
                </span>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(event.start_date), 'MMM d')} • {event.location}
                  </p>
                </div>

                {event.status !== 'upcoming' && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0", statusConfig.className)}>
                    {event.status === 'open_registration' ? 'Open' : statusConfig.label}
                  </span>
                )}

                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isNotified={selectedEvent ? notifications.has(selectedEvent.id) : false}
        onToggleNotify={handleToggleNotify}
      />
    </div>
  );
}
