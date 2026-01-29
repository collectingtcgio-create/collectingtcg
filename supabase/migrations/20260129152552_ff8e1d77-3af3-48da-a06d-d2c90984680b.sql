-- Add video_url column to wall_posts table
ALTER TABLE public.wall_posts ADD COLUMN video_url text DEFAULT NULL;