import { useState } from 'react';
import { Calendar, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TcgEventGame, TournamentEvent } from './types';
import { EventFilters } from './EventFilters';
import { CalendarView } from './CalendarView';
import { ListView } from './ListView';
import { EventDetailModal } from './EventDetailModal';
import { useTournamentEvents } from '@/hooks/useTournamentEvents';
import { cn } from '@/lib/utils';

type ViewMode = 'calendar' | 'list';

export function EventsCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedGames, setSelectedGames] = useState<TcgEventGame[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TournamentEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { events, loading, notifications, toggleNotification } = useTournamentEvents(selectedGames);

  const handleToggleGame = (game: TcgEventGame) => {
    setSelectedGames(prev => {
      if (prev.includes(game)) {
        return prev.filter(g => g !== game);
      }
      return [...prev, game];
    });
  };

  const handleToggleNotify = async (eventId: string) => {
    await toggleNotification(eventId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            TCG Global Events
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track tournaments across all major trading card games
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex gap-6">
        {/* Filters Sidebar - Desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <EventFilters
            selectedGames={selectedGames}
            onToggleGame={handleToggleGame}
          />
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-y-0 left-0 w-80 bg-background border-r border-border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filters</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  ✕
                </Button>
              </div>
              <EventFilters
                selectedGames={selectedGames}
                onToggleGame={handleToggleGame}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="glass-card p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : viewMode === 'calendar' ? (
            <CalendarView 
              events={events} 
              onSelectEvent={setSelectedEvent}
            />
          ) : (
            <ListView 
              events={events}
              notifications={notifications}
              onToggleNotify={handleToggleNotify}
            />
          )}
        </div>
      </div>

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
