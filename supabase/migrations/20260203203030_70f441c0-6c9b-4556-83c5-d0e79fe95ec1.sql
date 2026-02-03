-- Create enums for privacy settings
CREATE TYPE public.profile_visibility AS ENUM ('public', 'friends_only', 'private');
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE public.friend_request_permission AS ENUM ('everyone', 'friends_of_friends', 'no_one');
CREATE TYPE public.follow_permission AS ENUM ('everyone', 'approval_required', 'no_one');
CREATE TYPE public.follow_status AS ENUM ('pending', 'approved');

-- Add new columns to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN profile_visibility public.profile_visibility NOT NULL DEFAULT 'public',
ADD COLUMN show_online_status boolean NOT NULL DEFAULT true,
ADD COLUMN friend_request_permission public.friend_request_permission NOT NULL DEFAULT 'everyone',
ADD COLUMN follow_permission public.follow_permission NOT NULL DEFAULT 'everyone';

-- Add online status tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN last_seen_at timestamp with time zone DEFAULT now(),
ADD COLUMN is_online boolean DEFAULT false;

-- Create friendships table
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Create followers table
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.follow_status NOT NULL DEFAULT 'approved',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check friendship
CREATE OR REPLACE FUNCTION public.are_friends(_user1_id uuid, _user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friendships
    WHERE status = 'accepted'
      AND (
        (requester_id = _user1_id AND addressee_id = _user2_id)
        OR (requester_id = _user2_id AND addressee_id = _user1_id)
      )
  )
$$;

-- Function to check if user can view profile
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Own profile
    _viewer_id = (SELECT user_id FROM public.profiles WHERE id = _profile_id)
    OR
    -- Check visibility setting
    EXISTS (
      SELECT 1
      FROM public.user_settings us
      WHERE us.user_id = _profile_id
        AND (
          us.profile_visibility = 'public'
          OR (us.profile_visibility = 'friends_only' AND public.are_friends(_viewer_id, _profile_id))
        )
    )
    OR
    -- No settings = public by default
    NOT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = _profile_id)
$$;

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked(_blocker_id uuid, _blocked_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_users
    WHERE blocker_id = _blocker_id AND blocked_id = _blocked_id
  )
$$;

-- Function to check if either user has blocked the other
CREATE OR REPLACE FUNCTION public.has_block_between(_user1_id uuid, _user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_users
    WHERE (blocker_id = _user1_id AND blocked_id = _user2_id)
       OR (blocker_id = _user2_id AND blocked_id = _user1_id)
  )
$$;

-- RLS Policies for friendships
CREATE POLICY "Users can view their own friendships"
ON public.friendships FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = requester_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = addressee_id AND user_id = auth.uid())
);

CREATE POLICY "Users can send friend requests"
ON public.friendships FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = requester_id AND user_id = auth.uid())
  AND NOT public.has_block_between(requester_id, addressee_id)
);

CREATE POLICY "Users can update friendships they're part of"
ON public.friendships FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = requester_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = addressee_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete their own friendships"
ON public.friendships FOR DELETE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = requester_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = addressee_id AND user_id = auth.uid())
);

-- RLS Policies for followers
CREATE POLICY "Users can view followers"
ON public.followers FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = follower_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = following_id AND user_id = auth.uid())
  OR (status = 'approved' AND NOT public.has_block_between(get_profile_id(auth.uid()), following_id))
);

CREATE POLICY "Users can follow others"
ON public.followers FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = follower_id AND user_id = auth.uid())
  AND NOT public.has_block_between(follower_id, following_id)
);

CREATE POLICY "Users can update their follow relationships"
ON public.followers FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = follower_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = following_id AND user_id = auth.uid())
);

CREATE POLICY "Users can unfollow or remove followers"
ON public.followers FOR DELETE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = follower_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = following_id AND user_id = auth.uid())
);

-- Add policy to user_settings to allow reading others' visibility settings
CREATE POLICY "Users can read visibility settings for profile access check"
ON public.user_settings FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = user_settings.user_id AND user_id = auth.uid())
  OR true -- Allow reading to check visibility (function uses security definer anyway)
);

-- Create indexes for performance
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);
CREATE INDEX idx_followers_follower ON public.followers(follower_id);
CREATE INDEX idx_followers_following ON public.followers(following_id);
CREATE INDEX idx_profiles_last_seen ON public.profiles(last_seen_at);

-- Enable realtime for friendships and followers
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;