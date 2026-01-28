-- Create enum for TCG game types
CREATE TYPE public.tcg_event_game AS ENUM ('pokemon', 'magic', 'yugioh', 'onepiece', 'lorcana');

-- Create enum for event status
CREATE TYPE public.event_status AS ENUM ('upcoming', 'open_registration', 'sold_out', 'live', 'completed');

-- Create tournament_events table
CREATE TABLE public.tournament_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type public.tcg_event_game NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  external_link TEXT,
  is_major BOOLEAN DEFAULT false,
  status public.event_status DEFAULT 'upcoming',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_event_notifications table for "Notify Me" feature
CREATE TABLE public.user_event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, event_id)
);

-- Create user_roles table for admin access (following security guidelines)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.tournament_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournament_events
CREATE POLICY "Tournament events are viewable by everyone"
ON public.tournament_events FOR SELECT
USING (true);

CREATE POLICY "Admins can insert tournament events"
ON public.tournament_events FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tournament events"
ON public.tournament_events FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tournament events"
ON public.tournament_events FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for user_event_notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_event_notifications FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = user_event_notifications.user_id
    AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create their own notifications"
ON public.user_event_notifications FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = user_event_notifications.user_id
    AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own notifications"
ON public.user_event_notifications FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = user_event_notifications.user_id
    AND profiles.user_id = auth.uid()
));

-- RLS policies for user_roles (only admins can manage)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_tournament_events_updated_at
BEFORE UPDATE ON public.tournament_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mock 2026 tournament data
INSERT INTO public.tournament_events (game_type, title, location, start_date, end_date, external_link, is_major, status, description) VALUES
-- Pokemon Events
('pokemon', 'EUIC 2026', 'Frankfurt, Germany', '2026-02-20', '2026-02-23', 'https://pokemon.com/euic', true, 'open_registration', 'European International Championships 2026'),
('pokemon', 'NAIC 2026', 'Columbus, USA', '2026-06-19', '2026-06-22', 'https://pokemon.com/naic', true, 'upcoming', 'North American International Championships 2026'),
('pokemon', 'Pokemon World Championships 2026', 'Yokohama, Japan', '2026-08-14', '2026-08-16', 'https://pokemon.com/worlds', true, 'upcoming', 'The pinnacle of competitive Pokemon'),
('pokemon', 'LAIC 2026', 'São Paulo, Brazil', '2026-11-13', '2026-11-16', 'https://pokemon.com/laic', true, 'upcoming', 'Latin American International Championships 2026'),
('pokemon', 'OCIC 2026', 'Melbourne, Australia', '2026-03-06', '2026-03-08', 'https://pokemon.com/ocic', true, 'upcoming', 'Oceania International Championships 2026'),

-- Magic Events
('magic', 'Pro Tour Chicago 2026', 'Chicago, USA', '2026-02-27', '2026-03-01', 'https://magic.gg/protour', true, 'open_registration', 'Pro Tour Modern'),
('magic', 'MagicCon Amsterdam 2026', 'Amsterdam, Netherlands', '2026-06-05', '2026-06-08', 'https://magic.gg/magiccon', true, 'upcoming', 'The ultimate Magic celebration'),
('magic', 'Magic World Championship 2026', 'Las Vegas, USA', '2026-09-18', '2026-09-20', 'https://magic.gg/worlds', true, 'upcoming', 'The World Championship'),
('magic', 'Pro Tour Barcelona 2026', 'Barcelona, Spain', '2026-04-24', '2026-04-26', 'https://magic.gg/protour', true, 'upcoming', 'Pro Tour Standard'),

-- Yu-Gi-Oh Events
('yugioh', 'YCS Charlotte 2026', 'Charlotte, USA', '2026-01-24', '2026-01-25', 'https://yugioh-card.com/ycs', true, 'sold_out', 'Yu-Gi-Oh Championship Series'),
('yugioh', 'European Championship 2026', 'Berlin, Germany', '2026-07-11', '2026-07-12', 'https://yugioh-card.com/euro', true, 'upcoming', 'European Championship'),
('yugioh', 'Yu-Gi-Oh World Championship 2026', 'Tokyo, Japan', '2026-08-22', '2026-08-23', 'https://yugioh-card.com/worlds', true, 'upcoming', 'World Championship'),
('yugioh', 'YCS London 2026', 'London, UK', '2026-05-09', '2026-05-10', 'https://yugioh-card.com/ycs', true, 'upcoming', 'Yu-Gi-Oh Championship Series'),

-- One Piece Events
('onepiece', 'One Piece Championship 2026 - Americas', 'Los Angeles, USA', '2026-03-21', '2026-03-22', 'https://onepiece-cardgame.com', true, 'open_registration', 'Regional Championship'),
('onepiece', 'One Piece Championship 2026 - Europe', 'Paris, France', '2026-05-16', '2026-05-17', 'https://onepiece-cardgame.com', true, 'upcoming', 'Regional Championship'),
('onepiece', 'One Piece World Championship 2026', 'Tokyo, Japan', '2026-12-05', '2026-12-06', 'https://onepiece-cardgame.com', true, 'upcoming', 'World Championship'),

-- Lorcana Events
('lorcana', 'Lorcana Challenge 2026 - Spring', 'Orlando, USA', '2026-04-04', '2026-04-05', 'https://disneylorcana.com', true, 'upcoming', 'Major Lorcana Tournament'),
('lorcana', 'Lorcana European Championship 2026', 'London, UK', '2026-06-27', '2026-06-28', 'https://disneylorcana.com', true, 'upcoming', 'European Championship'),
('lorcana', 'Lorcana World Championship 2026', 'Anaheim, USA', '2026-10-17', '2026-10-18', 'https://disneylorcana.com', true, 'upcoming', 'World Championship');