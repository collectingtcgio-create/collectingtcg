-- Fix broken RLS policies on user_cards table
-- The current policies incorrectly compare profiles.id = profiles.user_id
-- They should compare profiles.id = user_cards.user_id

-- Drop existing broken policies
DROP POLICY IF EXISTS "Users can insert their own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON public.user_cards;

-- Recreate with correct logic
CREATE POLICY "Users can insert their own cards" 
ON public.user_cards FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_cards.user_id 
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own cards" 
ON public.user_cards FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_cards.user_id 
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own cards" 
ON public.user_cards FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_cards.user_id 
    AND profiles.user_id = auth.uid()
  )
);