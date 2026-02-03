-- Add accepts_offers to marketplace_listings
ALTER TABLE public.marketplace_listings 
ADD COLUMN accepts_offers boolean NOT NULL DEFAULT true;

-- Create listing_offers table for buy/counter-offer flow
CREATE TABLE public.listing_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'expired', 'cancelled')),
  is_counter BOOLEAN NOT NULL DEFAULT false,
  parent_offer_id UUID REFERENCES public.listing_offers(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create listing_messages table for conversations
CREATE TABLE public.listing_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.listing_offers(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'offer_sent', 'counter_sent', 'offer_accepted', 'offer_declined', 'offer_expired', 'buy_now')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listing_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for listing_offers
CREATE POLICY "Users can view offers they're part of"
ON public.listing_offers FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_offers.buyer_id AND profiles.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_offers.seller_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Buyers can create offers"
ON public.listing_offers FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_offers.buyer_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Participants can update offers"
ON public.listing_offers FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_offers.buyer_id AND profiles.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_offers.seller_id AND profiles.user_id = auth.uid())
);

-- RLS policies for listing_messages
CREATE POLICY "Users can view their listing messages"
ON public.listing_messages FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_messages.sender_id AND profiles.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_messages.recipient_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can send listing messages"
ON public.listing_messages FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_messages.sender_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Recipients can mark messages as read"
ON public.listing_messages FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_messages.recipient_id AND profiles.user_id = auth.uid())
);

-- Add indexes for performance
CREATE INDEX idx_listing_offers_listing_id ON public.listing_offers(listing_id);
CREATE INDEX idx_listing_offers_buyer_id ON public.listing_offers(buyer_id);
CREATE INDEX idx_listing_offers_seller_id ON public.listing_offers(seller_id);
CREATE INDEX idx_listing_offers_status ON public.listing_offers(status);
CREATE INDEX idx_listing_messages_listing_id ON public.listing_messages(listing_id);
CREATE INDEX idx_listing_messages_offer_id ON public.listing_messages(offer_id);

-- Add trigger for updated_at on listing_offers
CREATE TRIGGER update_listing_offers_updated_at
BEFORE UPDATE ON public.listing_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for offers and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.listing_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listing_messages;