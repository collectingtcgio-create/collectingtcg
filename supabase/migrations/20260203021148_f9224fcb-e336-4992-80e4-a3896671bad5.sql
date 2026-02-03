-- Drop the problematic policy
DROP POLICY IF EXISTS "Sellers can create counter-offers" ON public.listing_offers;

-- Create a security definer function to validate parent offer
CREATE OR REPLACE FUNCTION public.validate_counter_offer(
  _parent_offer_id uuid,
  _listing_id uuid,
  _buyer_id uuid,
  _seller_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _parent_offer_id IS NULL 
    OR EXISTS (
      SELECT 1
      FROM public.listing_offers parent
      WHERE parent.id = _parent_offer_id
        AND parent.listing_id = _listing_id
        AND parent.buyer_id = _buyer_id
        AND parent.seller_id = _seller_id
    )
$$;

-- Create a security definer function to check if user is seller of listing
CREATE OR REPLACE FUNCTION public.is_listing_seller(_listing_id uuid, _seller_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.marketplace_listings ml
    WHERE ml.id = _listing_id
      AND ml.seller_id = _seller_id
  )
$$;

-- Create a security definer function to get profile id from auth user
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Recreate the policy using the security definer functions
CREATE POLICY "Sellers can create counter-offers"
ON public.listing_offers
FOR INSERT
WITH CHECK (
  is_counter = true
  AND listing_offers.seller_id = public.get_profile_id(auth.uid())
  AND public.is_listing_seller(listing_offers.listing_id, listing_offers.seller_id)
  AND public.validate_counter_offer(
    listing_offers.parent_offer_id,
    listing_offers.listing_id,
    listing_offers.buyer_id,
    listing_offers.seller_id
  )
);