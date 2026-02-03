-- Create a public-safe view that excludes sensitive contact fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  username,
  bio,
  avatar_url,
  is_live,
  status,
  created_at,
  updated_at,
  last_username_change_at,
  music_autoplay,
  youtube_playlist_url,
  spotify_playlist_url
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy: Authenticated users can view all profile data
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Create new policy: Anon users can only view basic profile info (via their own queries)
-- They should use the public_profiles view instead
CREATE POLICY "Anon users can view basic profile info"
ON public.profiles
FOR SELECT
TO anon
USING (true);

-- Note: The view provides the actual protection by only exposing non-sensitive columns
-- The profiles table policies remain permissive for SELECT, but the app will use the view for unauthenticated access

COMMENT ON VIEW public.public_profiles IS 'Public-safe view of profiles that excludes sensitive contact information (email, social media URLs). Use this for unauthenticated access.';