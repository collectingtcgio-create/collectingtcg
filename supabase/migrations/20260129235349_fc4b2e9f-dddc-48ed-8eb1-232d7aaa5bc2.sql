-- Create scan cache table for storing TCG scan results
CREATE TABLE public.scan_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game text NOT NULL,
  identifier text NOT NULL,
  card_name text,
  set_name text,
  card_number text,
  image_url text,
  price_low numeric,
  price_market numeric,
  price_high numeric,
  confidence numeric,
  raw_ocr_text text,
  candidates jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE(game, identifier)
);

-- Create index for fast lookups
CREATE INDEX idx_scan_cache_lookup ON public.scan_cache(game, identifier);
CREATE INDEX idx_scan_cache_expires ON public.scan_cache(expires_at);

-- Create rate limiting table
CREATE TABLE public.scan_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier text NOT NULL,
  scan_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_identifier)
);

CREATE INDEX idx_rate_limits_user ON public.scan_rate_limits(user_identifier);

-- Enable RLS
ALTER TABLE public.scan_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_rate_limits ENABLE ROW LEVEL SECURITY;

-- Cache is readable by authenticated users (for checking cache hits)
CREATE POLICY "Scan cache is readable by authenticated users"
ON public.scan_cache FOR SELECT
USING (auth.role() = 'authenticated');

-- Rate limits managed by service role only (edge function)
CREATE POLICY "Rate limits managed by service role"
ON public.scan_rate_limits FOR ALL
USING (auth.role() = 'service_role');

-- Allow service role to manage cache
CREATE POLICY "Service role manages scan cache"
ON public.scan_cache FOR ALL
USING (auth.role() = 'service_role');