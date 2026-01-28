-- Add autoplay setting column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN music_autoplay boolean DEFAULT false;