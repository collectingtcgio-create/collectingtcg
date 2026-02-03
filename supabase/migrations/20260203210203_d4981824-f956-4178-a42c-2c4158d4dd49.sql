-- Drop existing restrictive select policy
DROP POLICY IF EXISTS "Users can view followers" ON public.followers;

-- Create a new policy that allows viewing approved followers publicly
CREATE POLICY "Approved followers are viewable by everyone"
ON public.followers
FOR SELECT
USING (
  status = 'approved'::follow_status
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = followers.follower_id AND profiles.user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = followers.following_id AND profiles.user_id = auth.uid())
);