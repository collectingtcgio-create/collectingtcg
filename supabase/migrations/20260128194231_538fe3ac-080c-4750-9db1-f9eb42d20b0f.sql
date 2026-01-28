-- Add music player columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN spotify_playlist_url text DEFAULT '',
ADD COLUMN youtube_playlist_url text DEFAULT '';