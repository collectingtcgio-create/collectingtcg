import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  Calendar, 
  Shield,
  Save,
  X
} from 'lucide-react';
import { TournamentEvent, TcgEventGame, EventStatus, GAME_CONFIGS, STATUS_CONFIG } from '@/components/events/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type FormData = {
  game_type: TcgEventGame;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  external_link: string;
  is_major: boolean;
  status: EventStatus;
  description: string;
};

const initialFormData: FormData = {
  game_type: 'pokemon',
  title: '',
  location: '',
  start_date: '',
  end_date: '',
  external_link: '',
  is_major: false,
  status: 'upcoming',
  description: ''
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();

  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
    }
  }, [isAdmin]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('tournament_events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive"
      });
    } else {
      setEvents((data as TournamentEvent[]) || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('tournament_events')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('tournament_events')
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event created successfully"
        });
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event: TournamentEvent) => {
    setFormData({
      game_type: event.game_type,
      title: event.title,
      location: event.location,
      start_date: event.start_date,
      end_date: event.end_date,
      external_link: event.external_link || '',
      is_major: event.is_major,
      status: event.status,
      description: event.description || ''
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const { error } = await supabase
      .from('tournament_events')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
      fetchEvents();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  if (adminLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage tournament events</p>
            </div>
          </div>
          
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          )}
        </div>

        {/* Event Form */}
        {showForm && (
          <div className="glass-card p-6 mb-8 neon-border-cyan">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Event' : 'Add New Event'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Game Type */}
                <div className="space-y-2">
                  <Label>Game Type</Label>
                  <Select
                    value={formData.game_type}
                    onValueChange={(value: TcgEventGame) => 
                      setFormData(prev => ({ ...prev, game_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(GAME_CONFIGS).map(game => (
                        <SelectItem key={game.id} value={game.id}>
                          <span className="flex items-center gap-2">
                            {game.icon} {game.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: EventStatus) => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Event Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Pokemon World Championships 2026"
                    required
                  />
                </div>

                {/* Location */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Yokohama, Japan"
                    required
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>

                {/* External Link */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Registration Link (optional)</Label>
                  <Input
                    type="url"
                    value={formData.external_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, external_link: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description..."
                    rows={3}
                  />
                </div>

                {/* Is Major */}
                <div className="flex items-center gap-2 md:col-span-2">
                  <Checkbox
                    id="is_major"
                    checked={formData.is_major}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_major: checked as boolean }))
                    }
                  />
                  <Label htmlFor="is_major" className="cursor-pointer">
                    Mark as Major Event (World Championships, International Championships, etc.)
                  </Label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingId ? 'Update Event' : 'Create Event'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              All Events ({events.length})
            </h2>
          </div>
          
          <div className="divide-y divide-border">
            {events.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No events found. Add your first event!
              </div>
            ) : (
              events.map(event => {
                const gameConfig = GAME_CONFIGS[event.game_type];
                const statusConfig = STATUS_CONFIG[event.status];
                
                return (
                  <div 
                    key={event.id} 
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span 
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                          gameConfig.bgColor
                        )}
                      >
                        {gameConfig.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{event.title}</h3>
                          {event.is_major && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                              Major
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{event.location}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(event.start_date), 'MMM d')} - {format(new Date(event.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs px-2 py-1 rounded-full", statusConfig.className)}>
                        {statusConfig.label}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
