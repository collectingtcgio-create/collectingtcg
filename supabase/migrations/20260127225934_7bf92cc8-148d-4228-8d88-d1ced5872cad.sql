-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follows table
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create user_cards table
CREATE TABLE public.user_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  card_name TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  price_estimate DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create top_eight table (can link to either a card or a friend)
CREATE TABLE public.top_eight (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 8),
  card_id UUID REFERENCES public.user_cards(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, position),
  CHECK ((card_id IS NOT NULL AND friend_id IS NULL) OR (card_id IS NULL AND friend_id IS NOT NULL))
);

-- Create kudos table for the kudos wall
CREATE TABLE public.kudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_feed table for global activity
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_eight ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Profiles policies (public read, own write)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can create follows" ON public.follows FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = follower_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete their own follows" ON public.follows FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = follower_id AND user_id = auth.uid())
);

-- User cards policies
CREATE POLICY "User cards are viewable by everyone" ON public.user_cards FOR SELECT USING (true);
CREATE POLICY "Users can manage their own cards" ON public.user_cards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their own cards" ON public.user_cards FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete their own cards" ON public.user_cards FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND user_id = auth.uid())
);

-- Top eight policies
CREATE POLICY "Top eight is viewable by everyone" ON public.top_eight FOR SELECT USING (true);
CREATE POLICY "Users can manage their own top eight" ON public.top_eight FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND user_id = auth.uid())
);

-- Kudos policies
CREATE POLICY "Kudos are viewable by everyone" ON public.kudos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create kudos" ON public.kudos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete their own kudos" ON public.kudos FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid())
);

-- Activity feed policies
CREATE POLICY "Activity feed is viewable by everyone" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Users can create their own activity" ON public.activity_feed FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND user_id = auth.uid())
);

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles timestamp
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();