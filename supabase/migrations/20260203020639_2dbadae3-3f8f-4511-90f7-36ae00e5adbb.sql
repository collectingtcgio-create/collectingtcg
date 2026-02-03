-- Fix seller counter-offer inserts (was blocked by RLS)
-- Buyers may insert only normal offers (is_counter=false)
ALTER POLICY "Buyers can create offers" ON public.listing_offers
WITH CHECK (
  listing_offers.is_counter = false
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = listing_offers.buyer_id
      AND profiles.user_id = auth.uid()
  )
);

-- Sellers may insert counter-offers (is_counter=true) only for their own listings
CREATE POLICY "Sellers can create counter-offers"
ON public.listing_offers
FOR INSERT
WITH CHECK (
  listing_offers.is_counter = true
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = listing_offers.seller_id
      AND profiles.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.marketplace_listings ml
    WHERE ml.id = listing_offers.listing_id
      AND ml.seller_id = listing_offers.seller_id
  )
  AND (
    listing_offers.parent_offer_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.listing_offers parent
      WHERE parent.id = listing_offers.parent_offer_id
        AND parent.listing_id = listing_offers.listing_id
        AND parent.buyer_id = listing_offers.buyer_id
        AND parent.seller_id = listing_offers.seller_id
    )
  )
);