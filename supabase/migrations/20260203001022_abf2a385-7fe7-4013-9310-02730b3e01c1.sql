-- Add listing_type enum for singles, lots, sealed, bundles
CREATE TYPE public.listing_type AS ENUM ('single', 'lot', 'sealed', 'bundle');

-- Add rarity enum with common options plus custom support
CREATE TYPE public.card_rarity AS ENUM (
  'common', 'uncommon', 'rare', 'holo_rare', 'ultra_rare', 
  'secret_rare', 'special_art', 'full_art', 'promo', 'other'
);

-- Add new columns to marketplace_listings
ALTER TABLE public.marketplace_listings 
ADD COLUMN listing_type public.listing_type NOT NULL DEFAULT 'single',
ADD COLUMN rarity public.card_rarity DEFAULT NULL,
ADD COLUMN rarity_custom text DEFAULT NULL,
ADD COLUMN images text[] DEFAULT '{}',
ADD COLUMN quantity integer NOT NULL DEFAULT 1,
ADD COLUMN sold_at timestamp with time zone DEFAULT NULL,
ADD COLUMN sold_price numeric DEFAULT NULL;

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for fuzzy search on card_name and description
CREATE INDEX idx_marketplace_card_name_trgm ON public.marketplace_listings 
USING gin (card_name gin_trgm_ops);

CREATE INDEX idx_marketplace_description_trgm ON public.marketplace_listings 
USING gin (description gin_trgm_ops);

-- Create a function for fuzzy search across marketplace
CREATE OR REPLACE FUNCTION public.search_marketplace_listings(
  search_query text,
  similarity_threshold numeric DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  seller_id uuid,
  card_id uuid,
  card_name text,
  image_url text,
  images text[],
  tcg_game public.tcg_game,
  asking_price numeric,
  condition public.card_condition,
  listing_type public.listing_type,
  rarity public.card_rarity,
  rarity_custom text,
  quantity integer,
  description text,
  status public.listing_status,
  created_at timestamptz,
  updated_at timestamptz,
  sold_at timestamptz,
  sold_price numeric,
  similarity_score real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ml.id,
    ml.seller_id,
    ml.card_id,
    ml.card_name,
    ml.image_url,
    ml.images,
    ml.tcg_game,
    ml.asking_price,
    ml.condition,
    ml.listing_type,
    ml.rarity,
    ml.rarity_custom,
    ml.quantity,
    ml.description,
    ml.status,
    ml.created_at,
    ml.updated_at,
    ml.sold_at,
    ml.sold_price,
    GREATEST(
      similarity(ml.card_name, search_query),
      COALESCE(similarity(ml.description, search_query), 0)
    ) AS similarity_score
  FROM public.marketplace_listings ml
  WHERE 
    similarity(ml.card_name, search_query) > similarity_threshold
    OR similarity(COALESCE(ml.description, ''), search_query) > similarity_threshold
    OR ml.card_name ILIKE '%' || search_query || '%'
    OR ml.description ILIKE '%' || search_query || '%'
  ORDER BY similarity_score DESC;
END;
$$;