-- Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT '';

-- Create wall_posts table for Facebook-style posts
CREATE TABLE public.wall_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create wall_post_replies table for replies
CREATE TABLE public.wall_post_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.wall_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on wall_posts
ALTER TABLE public.wall_posts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on wall_post_replies
ALTER TABLE public.wall_post_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wall_posts
CREATE POLICY "Wall posts are viewable by everyone"
ON public.wall_posts
FOR SELECT
USING (true);

CREATE POLICY "Profile owners can create posts on their wall"
ON public.wall_posts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = wall_posts.author_id
    AND profiles.user_id = auth.uid()
  )
  AND author_id = profile_id
);

CREATE POLICY "Authors can update their own posts"
ON public.wall_posts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = wall_posts.author_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Authors can delete their own posts"
ON public.wall_posts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = wall_posts.author_id
    AND profiles.user_id = auth.uid()
  )
);

-- RLS Policies for wall_post_replies
CREATE POLICY "Replies are viewable by everyone"
ON public.wall_post_replies
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create replies"
ON public.wall_post_replies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = wall_post_replies.author_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Authors can delete their own replies"
ON public.wall_post_replies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = wall_post_replies.author_id
    AND profiles.user_id = auth.uid()
  )
);

-- Create storage bucket for wall post images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wall-posts', 'wall-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for wall-posts bucket
CREATE POLICY "Wall post images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'wall-posts');

CREATE POLICY "Authenticated users can upload wall post images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'wall-posts' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own wall post images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'wall-posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for wall_posts and wall_post_replies
ALTER PUBLICATION supabase_realtime ADD TABLE public.wall_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wall_post_replies;