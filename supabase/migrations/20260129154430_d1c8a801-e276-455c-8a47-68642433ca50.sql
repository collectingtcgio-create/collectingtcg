-- Add Rumble URL to profiles
ALTER TABLE public.profiles ADD COLUMN rumble_url text DEFAULT ''::text;