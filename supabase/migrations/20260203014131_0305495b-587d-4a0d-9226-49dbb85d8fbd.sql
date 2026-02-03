-- Drop and recreate the view with explicit SECURITY INVOKER (safe default)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
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

COMMENT ON VIEW public.public_profiles IS 'Public-safe view of profiles that excludes sensitive contact information (email, social media URLs). Use this for unauthenticated access.';