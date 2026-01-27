-- Drop existing broken policies for user_cards
DROP POLICY IF EXISTS "Users can manage their own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON public.user_cards;

-- Create corrected RLS policies that properly check user ownership
CREATE POLICY "Users can insert their own cards"
ON public.user_cards
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_cards.user_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own cards"
ON public.user_cards
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_cards.user_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own cards"
ON public.user_cards
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_cards.user_id
    AND profiles.user_id = auth.uid()
  )
);

-- Also fix activity_feed policy which has the same bug
DROP POLICY IF EXISTS "Users can create their own activity" ON public.activity_feed;

CREATE POLICY "Users can create their own activity"
ON public.activity_feed
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = activity_feed.user_id
    AND profiles.user_id = auth.uid()
  )
);

-- Fix top_eight policy
DROP POLICY IF EXISTS "Users can manage their own top eight" ON public.top_eight;

CREATE POLICY "Users can manage their own top eight"
ON public.top_eight
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = top_eight.user_id
    AND profiles.user_id = auth.uid()
  )
);