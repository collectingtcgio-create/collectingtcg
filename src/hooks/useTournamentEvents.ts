import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TournamentEvent, TcgEventGame } from '@/components/events/types';
import { useAuth } from '@/hooks/useAuth';

export function useTournamentEvents(gameFilters: TcgEventGame[]) {
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Set<string>>(new Set());
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchEvents();
    if (user && profile) {
      fetchNotifications();
    }
  }, [gameFilters, user, profile]);

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase
      .from('tournament_events')
      .select('*')
      .order('start_date', { ascending: true });

    if (gameFilters.length > 0) {
      query = query.in('game_type', gameFilters);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents((data as TournamentEvent[]) || []);
    }
    setLoading(false);
  };

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('user_event_notifications')
      .select('event_id')
      .eq('user_id', profile.id);

    if (data) {
      setNotifications(new Set(data.map(n => n.event_id)));
    }
  };

  const toggleNotification = async (eventId: string) => {
    if (!user || !profile) return false;

    const isNotified = notifications.has(eventId);

    if (isNotified) {
      const { error } = await supabase
        .from('user_event_notifications')
        .delete()
        .eq('user_id', profile.id)
        .eq('event_id', eventId);

      if (!error) {
        setNotifications(prev => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        return true;
      }
    } else {
      const { error } = await supabase
        .from('user_event_notifications')
        .insert({ user_id: profile.id, event_id: eventId });

      if (!error) {
        setNotifications(prev => new Set(prev).add(eventId));
        return true;
      }
    }
    return false;
  };

  return {
    events,
    loading,
    notifications,
    toggleNotification,
    refetch: fetchEvents
  };
}
