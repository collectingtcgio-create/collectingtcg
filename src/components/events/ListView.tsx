import { useMemo } from 'react';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { TournamentEvent } from './types';
import { EventCard } from './EventCard';

interface ListViewProps {
  events: TournamentEvent[];
  notifications: Set<string>;
  onToggleNotify: (eventId: string) => void;
}

export function ListView({ events, notifications, onToggleNotify }: ListViewProps) {
  const groupedEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const groups: { [key: string]: TournamentEvent[] } = {};
    
    // Sort events by start date
    const sortedEvents = [...events].sort((a, b) => 
      parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
    );

    // Filter to only upcoming or ongoing events
    const relevantEvents = sortedEvents.filter(event => {
      const endDate = parseISO(event.end_date);
      return !isBefore(endDate, today);
    });

    // Group by month
    relevantEvents.forEach(event => {
      const monthKey = format(parseISO(event.start_date), 'MMMM yyyy');
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(event);
    });

    return groups;
  }, [events]);

  const months = Object.keys(groupedEvents);

  if (months.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-muted-foreground">No upcoming events found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {months.map(month => (
        <div key={month}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {month}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groupedEvents[month].map(event => (
              <EventCard
                key={event.id}
                event={event}
                isNotified={notifications.has(event.id)}
                onToggleNotify={onToggleNotify}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
