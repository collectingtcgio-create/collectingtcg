-- Create global_posts table for Twitter-style global feed
CREATE TABLE public.global_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view global posts
CREATE POLICY "Global posts are viewable by everyone"
ON public.global_posts
FOR SELECT
USING (true);

-- Authenticated users can create their own posts
CREATE POLICY "Users can create their own posts"
ON public.global_posts
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = global_posts.author_id
  AND profiles.user_id = auth.uid()
));

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON public.global_posts
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = global_posts.author_id
  AND profiles.user_id = auth.uid()
));

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON public.global_posts
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = global_posts.author_id
  AND profiles.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_global_posts_updated_at
BEFORE UPDATE ON public.global_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for global posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_posts;