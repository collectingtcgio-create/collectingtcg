-- Create messaging privacy enum
CREATE TYPE public.messaging_privacy AS ENUM ('open', 'friends_only');

-- Create user_settings table for privacy and preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  messaging_privacy public.messaging_privacy NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_settings.user_id AND profiles.user_id = auth.uid()
  ));

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_settings.user_id AND profiles.user_id = auth.uid()
  ));

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_settings.user_id AND profiles.user_id = auth.uid()
  ));

-- Create blocked_users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS on blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = blocked_users.blocker_id AND profiles.user_id = auth.uid()
  ));

-- Users can block others
CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = blocked_users.blocker_id AND profiles.user_id = auth.uid()
  ));

-- Users can unblock others
CREATE POLICY "Users can unblock others"
  ON public.blocked_users FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = blocked_users.blocker_id AND profiles.user_id = auth.uid()
  ));

-- Add index for performance
CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- Create trigger for updating updated_at on user_settings
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();