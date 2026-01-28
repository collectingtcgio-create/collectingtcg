-- Create enum for TCG types
CREATE TYPE public.tcg_game AS ENUM (
  'pokemon',
  'magic',
  'yugioh',
  'onepiece',
  'dragonball',
  'lorcana',
  'unionarena'
);

-- Create cards cache table to store fetched card data
CREATE TABLE public.card_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  tcg_game tcg_game NOT NULL,
  card_name TEXT NOT NULL,
  set_name TEXT,
  set_code TEXT,
  card_number TEXT,
  rarity TEXT,
  image_url TEXT,
  image_url_small TEXT,
  price_low NUMERIC,
  price_mid NUMERIC,
  price_high NUMERIC,
  price_market NUMERIC,
  price_currency TEXT DEFAULT 'USD',
  price_source TEXT,
  price_updated_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(external_id, tcg_game)
);

-- Enable RLS
ALTER TABLE public.card_cache ENABLE ROW LEVEL SECURITY;

-- Card cache is readable by everyone (public reference data)
CREATE POLICY "Card cache is viewable by everyone"
ON public.card_cache FOR SELECT
USING (true);

-- Only system can insert/update (via edge functions with service role)
-- No user-facing write policies needed

-- Create index for fast lookups
CREATE INDEX idx_card_cache_name ON public.card_cache USING gin (to_tsvector('english', card_name));
CREATE INDEX idx_card_cache_game ON public.card_cache (tcg_game);
CREATE INDEX idx_card_cache_external_id ON public.card_cache (external_id, tcg_game);

-- Add trigger for updated_at
CREATE TRIGGER update_card_cache_updated_at
BEFORE UPDATE ON public.card_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add tcg_game column to user_cards for categorization
ALTER TABLE public.user_cards 
ADD COLUMN tcg_game tcg_game,
ADD COLUMN card_cache_id UUID REFERENCES public.card_cache(id);