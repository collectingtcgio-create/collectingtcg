-- Add 'marvel' to tcg_game enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'marvel' AND enumtypid = 'tcg_game'::regtype) THEN
    ALTER TYPE tcg_game ADD VALUE 'marvel';
  END IF;
END $$;

-- Create listing_status enum for marketplace
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'cancelled');

-- Create card_condition enum
CREATE TYPE card_condition AS ENUM ('near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged');

-- Create marketplace_listings table
CREATE TABLE public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.user_cards(id) ON DELETE SET NULL,
  card_name TEXT NOT NULL,
  image_url TEXT,
  tcg_game tcg_game NOT NULL,
  asking_price NUMERIC NOT NULL CHECK (asking_price >= 0),
  condition card_condition NOT NULL DEFAULT 'near_mint',
  description TEXT,
  status listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Everyone can view active listings
CREATE POLICY "Active listings are viewable by everyone"
ON public.marketplace_listings
FOR SELECT
USING (status = 'active' OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = marketplace_listings.seller_id 
  AND profiles.user_id = auth.uid()
));

-- Authenticated users can create listings
CREATE POLICY "Users can create their own listings"
ON public.marketplace_listings
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = marketplace_listings.seller_id 
  AND profiles.user_id = auth.uid()
));

-- Users can update their own listings
CREATE POLICY "Users can update their own listings"
ON public.marketplace_listings
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = marketplace_listings.seller_id 
  AND profiles.user_id = auth.uid()
));

-- Users can delete their own listings
CREATE POLICY "Users can delete their own listings"
ON public.marketplace_listings
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = marketplace_listings.seller_id 
  AND profiles.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_marketplace_listings_updated_at
BEFORE UPDATE ON public.marketplace_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();