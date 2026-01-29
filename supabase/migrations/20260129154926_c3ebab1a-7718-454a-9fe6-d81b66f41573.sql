-- Add YouTube URL to profiles for social link
ALTER TABLE public.profiles ADD COLUMN youtube_url text DEFAULT ''::text;