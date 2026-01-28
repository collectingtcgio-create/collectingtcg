-- Gift types enum
CREATE TYPE public.gift_type AS ENUM (
  'spark_hamster',
  'pirate_panda', 
  'wizard_owl',
  'magma_mole',
  'ghost_cat',
  'mecha_pup'
);

-- Gift source enum
CREATE TYPE public.gift_source AS ENUM (
  'live_stream',
  'comment_reply',
  'direct_message'
);

-- User wallets table
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  eco_credits INTEGER NOT NULL DEFAULT 0,
  earned_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "Users can view their own wallet"
  ON public.user_wallets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_wallets.user_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own wallet"
  ON public.user_wallets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_wallets.user_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own wallet"
  ON public.user_wallets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_wallets.user_id
    AND profiles.user_id = auth.uid()
  ));

-- Gift transactions table
CREATE TABLE public.gift_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_type gift_type NOT NULL,
  source gift_source NOT NULL,
  source_id UUID,
  credit_amount INTEGER NOT NULL,
  recipient_earned NUMERIC(10,2) NOT NULL,
  platform_revenue NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;

-- Transaction policies
CREATE POLICY "Users can view their own transactions"
  ON public.gift_transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = gift_transactions.sender_id AND profiles.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = gift_transactions.recipient_id AND profiles.user_id = auth.uid())
  );

CREATE POLICY "Users can create transactions"
  ON public.gift_transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = gift_transactions.sender_id
    AND profiles.user_id = auth.uid()
  ));

-- User wants table (cards users want)
CREATE TABLE public.user_wants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  tcg_game public.tcg_game NOT NULL,
  max_price NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_wants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wants are viewable by everyone"
  ON public.user_wants FOR SELECT USING (true);

CREATE POLICY "Users can manage their own wants"
  ON public.user_wants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_wants.user_id
    AND profiles.user_id = auth.uid()
  ));

-- User haves table (cards users have for trade)
CREATE TABLE public.user_haves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  tcg_game public.tcg_game NOT NULL,
  condition public.card_condition NOT NULL DEFAULT 'near_mint',
  asking_price NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_haves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Haves are viewable by everyone"
  ON public.user_haves FOR SELECT USING (true);

CREATE POLICY "Users can manage their own haves"
  ON public.user_haves FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_haves.user_id
    AND profiles.user_id = auth.uid()
  ));

-- Trade proposals table
CREATE TABLE public.trade_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
  ON public.trade_proposals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = trade_proposals.proposer_id AND profiles.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = trade_proposals.recipient_id AND profiles.user_id = auth.uid())
  );

CREATE POLICY "Users can create trades"
  ON public.trade_proposals FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = trade_proposals.proposer_id
    AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own trades"
  ON public.trade_proposals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = trade_proposals.proposer_id AND profiles.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = trade_proposals.recipient_id AND profiles.user_id = auth.uid())
  );

-- Trade items table (cards in a trade)
CREATE TABLE public.trade_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trade_proposals(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.user_cards(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trade items viewable by trade participants"
  ON public.trade_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trade_proposals tp
    WHERE tp.id = trade_items.trade_id
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = tp.proposer_id AND profiles.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = tp.recipient_id AND profiles.user_id = auth.uid())
    )
  ));

CREATE POLICY "Users can add items to their trades"
  ON public.trade_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = trade_items.owner_id
    AND profiles.user_id = auth.uid()
  ));

-- Live streams table
CREATE TABLE public.live_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  viewer_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active streams are viewable by everyone"
  ON public.live_streams FOR SELECT USING (true);

CREATE POLICY "Users can manage their own streams"
  ON public.live_streams FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = live_streams.streamer_id
    AND profiles.user_id = auth.uid()
  ));

-- Live stream chat messages
CREATE TABLE public.stream_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  gift_type gift_type,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stream_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stream chat is viewable by everyone"
  ON public.stream_chat FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post to stream chat"
  ON public.stream_chat FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = stream_chat.user_id
    AND profiles.user_id = auth.uid()
  ));

-- Enable realtime for gift transactions and stream chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;

-- Add updated_at trigger
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trade_proposals_updated_at
  BEFORE UPDATE ON public.trade_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();