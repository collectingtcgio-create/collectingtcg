-- Add column to track when username was last changed
ALTER TABLE public.profiles 
ADD COLUMN last_username_change_at timestamp with time zone DEFAULT NULL;