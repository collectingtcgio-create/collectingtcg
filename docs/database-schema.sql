-- =============================================================================
-- RUMBLE TCG - COMPLETE DATABASE SCHEMA
-- Generated: 2026-02-03
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TYPE public.card_condition AS ENUM (
  'near_mint',
  'lightly_played',
  'moderately_played',
  'heavily_played',
  'damaged'
);

CREATE TYPE public.card_rarity AS ENUM (
  'common',
  'uncommon',
  'rare',
  'holo_rare',
  'ultra_rare',
  'secret_rare',
  'special_art',
  'full_art',
  'promo',
  'other'
);

CREATE TYPE public.event_status AS ENUM (
  'upcoming',
  'open_registration',
  'sold_out',
  'live',
  'completed'
);

CREATE TYPE public.follow_permission AS ENUM ('everyone', 'approval_required', 'no_one');

CREATE TYPE public.follow_status AS ENUM ('pending', 'approved');

CREATE TYPE public.friend_request_permission AS ENUM ('everyone', 'friends_of_friends', 'no_one');

CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TYPE public.gift_source AS ENUM ('live_stream', 'comment_reply', 'direct_message');

CREATE TYPE public.gift_type AS ENUM (
  'spark_hamster',
  'pirate_panda',
  'wizard_owl',
  'magma_mole',
  'ghost_cat',
  'mecha_pup'
);

CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'cancelled');

CREATE TYPE public.listing_type AS ENUM ('single', 'lot', 'sealed', 'bundle');

CREATE TYPE public.messaging_privacy AS ENUM ('open', 'friends_only', 'buyers_only');

CREATE TYPE public.profile_visibility AS ENUM ('public', 'friends_only', 'private');

CREATE TYPE public.tcg_event_game AS ENUM ('pokemon', 'magic', 'yugioh', 'onepiece', 'lorcana');

CREATE TYPE public.tcg_game AS ENUM (
  'pokemon',
  'magic',
  'yugioh',
  'onepiece',
  'dragonball',
  'lorcana',
  'unionarena',
  'marvel',
  'starwars'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  bio text DEFAULT ''::text,
  avatar_url text DEFAULT ''::text,
  status text DEFAULT ''::text,
  email_contact text DEFAULT ''::text,
  twitter_url text DEFAULT ''::text,
  instagram_url text DEFAULT ''::text,
  facebook_url text DEFAULT ''::text,
  youtube_url text DEFAULT ''::text,
  tiktok_url text DEFAULT ''::text,
  website_url text DEFAULT ''::text,
  rumble_url text DEFAULT ''::text,
  spotify_playlist_url text DEFAULT ''::text,
  youtube_playlist_url text DEFAULT ''::text,
  music_autoplay boolean DEFAULT false,
  is_live boolean DEFAULT false,
  is_online boolean DEFAULT false,
  last_seen_at timestamp with time zone DEFAULT now(),
  last_username_change_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- public_profiles (VIEW - sanitized for anonymous access)
-- -----------------------------------------------------------------------------
CREATE VIEW public.public_profiles WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  username,
  bio,
  avatar_url,
  status,
  spotify_playlist_url,
  youtube_playlist_url,
  music_autoplay,
  is_live,
  last_username_change_at,
  created_at,
  updated_at
FROM public.profiles;

-- -----------------------------------------------------------------------------
-- user_roles
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- -----------------------------------------------------------------------------
-- user_settings
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  profile_visibility public.profile_visibility NOT NULL DEFAULT 'public'::profile_visibility,
  messaging_privacy public.messaging_privacy NOT NULL DEFAULT 'open'::messaging_privacy,
  friend_request_permission public.friend_request_permission NOT NULL DEFAULT 'everyone'::friend_request_permission,
  follow_permission public.follow_permission NOT NULL DEFAULT 'everyone'::follow_permission,
  show_online_status boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- user_wallets
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  eco_credits integer NOT NULL DEFAULT 0,
  earned_balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- blocked_users
-- -----------------------------------------------------------------------------
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

-- -----------------------------------------------------------------------------
-- friendships
-- -----------------------------------------------------------------------------
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id),
  addressee_id uuid NOT NULL REFERENCES public.profiles(id),
  status public.friendship_status NOT NULL DEFAULT 'pending'::friendship_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);

-- -----------------------------------------------------------------------------
-- followers
-- -----------------------------------------------------------------------------
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id),
  following_id uuid NOT NULL REFERENCES public.profiles(id),
  status public.follow_status NOT NULL DEFAULT 'approved'::follow_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

-- -----------------------------------------------------------------------------
-- follows (legacy/alternate)
-- -----------------------------------------------------------------------------
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id),
  following_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- card_cache
-- -----------------------------------------------------------------------------
CREATE TABLE public.card_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  tcg_game public.tcg_game NOT NULL,
  card_name text NOT NULL,
  card_number text,
  set_code text,
  set_name text,
  rarity text,
  image_url text,
  image_url_small text,
  price_low numeric,
  price_mid numeric,
  price_high numeric,
  price_market numeric,
  price_currency text DEFAULT 'USD'::text,
  price_source text,
  price_updated_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (external_id, tcg_game)
);

-- -----------------------------------------------------------------------------
-- user_cards
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  card_cache_id uuid REFERENCES public.card_cache(id),
  card_name text NOT NULL,
  image_url text DEFAULT ''::text,
  tcg_game public.tcg_game,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 20),
  price_estimate numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- user_haves
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_haves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  card_name text NOT NULL,
  tcg_game public.tcg_game NOT NULL,
  condition public.card_condition NOT NULL DEFAULT 'near_mint'::card_condition,
  asking_price numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- user_wants
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_wants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  card_name text NOT NULL,
  tcg_game public.tcg_game NOT NULL,
  max_price numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- marketplace_listings
-- -----------------------------------------------------------------------------
CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id),
  card_id uuid REFERENCES public.user_cards(id),
  card_name text NOT NULL,
  image_url text,
  images text[] DEFAULT '{}'::text[],
  tcg_game public.tcg_game NOT NULL,
  asking_price numeric NOT NULL,
  condition public.card_condition NOT NULL DEFAULT 'near_mint'::card_condition,
  listing_type public.listing_type NOT NULL DEFAULT 'single'::listing_type,
  rarity public.card_rarity,
  rarity_custom text,
  quantity integer NOT NULL DEFAULT 1,
  description text,
  status public.listing_status NOT NULL DEFAULT 'active'::listing_status,
  accepts_offers boolean NOT NULL DEFAULT true,
  sold_at timestamp with time zone,
  sold_price numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create GIN indexes for fuzzy search
CREATE INDEX idx_marketplace_listings_card_name_trgm ON public.marketplace_listings USING gin (card_name gin_trgm_ops);
CREATE INDEX idx_marketplace_listings_description_trgm ON public.marketplace_listings USING gin (description gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- listing_offers
-- -----------------------------------------------------------------------------
CREATE TABLE public.listing_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id),
  seller_id uuid NOT NULL REFERENCES public.profiles(id),
  parent_offer_id uuid REFERENCES public.listing_offers(id),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  is_counter boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- listing_messages
-- -----------------------------------------------------------------------------
CREATE TABLE public.listing_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.listing_offers(id),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  message_type text NOT NULL DEFAULT 'text'::text,
  content text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- trade_proposals
-- -----------------------------------------------------------------------------
CREATE TABLE public.trade_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id uuid NOT NULL REFERENCES public.profiles(id),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  message text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- trade_items
-- -----------------------------------------------------------------------------
CREATE TABLE public.trade_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trade_proposals(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  card_id uuid NOT NULL REFERENCES public.user_cards(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- top_eight
-- -----------------------------------------------------------------------------
CREATE TABLE public.top_eight (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  position integer NOT NULL CHECK (position >= 1 AND position <= 8),
  card_id uuid REFERENCES public.user_cards(id),
  friend_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, position)
);

-- -----------------------------------------------------------------------------
-- wall_posts
-- -----------------------------------------------------------------------------
CREATE TABLE public.wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  image_url text,
  video_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- wall_post_replies
-- -----------------------------------------------------------------------------
CREATE TABLE public.wall_post_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.wall_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  gift_type public.gift_type,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- global_posts
-- -----------------------------------------------------------------------------
CREATE TABLE public.global_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  image_url text,
  video_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- kudos
-- -----------------------------------------------------------------------------
CREATE TABLE public.kudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- activity_feed
-- -----------------------------------------------------------------------------
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- live_streams
-- -----------------------------------------------------------------------------
CREATE TABLE public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  viewer_count integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone
);

-- -----------------------------------------------------------------------------
-- stream_chat
-- -----------------------------------------------------------------------------
CREATE TABLE public.stream_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  gift_type public.gift_type,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- gift_transactions
-- -----------------------------------------------------------------------------
CREATE TABLE public.gift_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  gift_type public.gift_type NOT NULL,
  source public.gift_source NOT NULL,
  source_id uuid,
  credit_amount integer NOT NULL,
  recipient_earned numeric NOT NULL,
  platform_revenue numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- tournament_events
-- -----------------------------------------------------------------------------
CREATE TABLE public.tournament_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text NOT NULL,
  game_type public.tcg_event_game NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.event_status DEFAULT 'upcoming'::event_status,
  is_major boolean DEFAULT false,
  external_link text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- user_event_notifications
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_event_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

-- -----------------------------------------------------------------------------
-- scan_cache
-- -----------------------------------------------------------------------------
CREATE TABLE public.scan_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  game text NOT NULL,
  card_name text,
  card_number text,
  set_name text,
  image_url text,
  price_low numeric,
  price_market numeric,
  price_high numeric,
  confidence numeric,
  raw_ocr_text text,
  candidates jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

-- -----------------------------------------------------------------------------
-- scan_rate_limits
-- -----------------------------------------------------------------------------
CREATE TABLE public.scan_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier text NOT NULL,
  scan_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- has_role - Check if user has a specific role (avoids RLS recursion)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- -----------------------------------------------------------------------------
-- are_friends - Check if two users are friends
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.are_friends(_user1_id uuid, _user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friendships
    WHERE status = 'accepted'
      AND (
        (requester_id = _user1_id AND addressee_id = _user2_id)
        OR (requester_id = _user2_id AND addressee_id = _user1_id)
      )
  )
$$;

-- -----------------------------------------------------------------------------
-- is_blocked - Check if one user has blocked another
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_blocked(_blocker_id uuid, _blocked_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_users
    WHERE blocker_id = _blocker_id AND blocked_id = _blocked_id
  )
$$;

-- -----------------------------------------------------------------------------
-- has_block_between - Check if there's any block between two users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_block_between(_user1_id uuid, _user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_users
    WHERE (blocker_id = _user1_id AND blocked_id = _user2_id)
       OR (blocker_id = _user2_id AND blocked_id = _user1_id)
  )
$$;

-- -----------------------------------------------------------------------------
-- can_view_profile - Check if viewer can see a profile
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Own profile
    _viewer_id = (SELECT user_id FROM public.profiles WHERE id = _profile_id)
    OR
    -- Check visibility setting
    EXISTS (
      SELECT 1
      FROM public.user_settings us
      WHERE us.user_id = _profile_id
        AND (
          us.profile_visibility = 'public'
          OR (us.profile_visibility = 'friends_only' AND public.are_friends(_viewer_id, _profile_id))
        )
    )
    OR
    -- No settings = public by default
    NOT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = _profile_id)
$$;

-- -----------------------------------------------------------------------------
-- get_profile_id - Get profile ID from auth user ID
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- -----------------------------------------------------------------------------
-- is_listing_seller - Check if user is seller of a listing
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- validate_counter_offer - Validate counter offer chain
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- search_marketplace_listings - Fuzzy search for listings
-- -----------------------------------------------------------------------------
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  sold_at timestamp with time zone,
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

-- -----------------------------------------------------------------------------
-- update_updated_at_column - Trigger function for timestamps
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- handle_new_user - Create profile on signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)));
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-create profile on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_haves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_eight ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wall_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wall_post_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_rate_limits ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PROFILES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Anon users can view basic profile info" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- USER_ROLES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- USER_SETTINGS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_settings.user_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can read visibility settings for profile access check" ON public.user_settings
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = user_settings.user_id AND profiles.user_id = auth.uid()))
    OR true
  );

CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_settings.user_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_settings.user_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- USER_WALLETS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own wallet" ON public.user_wallets
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_wallets.user_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own wallet" ON public.user_wallets
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_wallets.user_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own wallet" ON public.user_wallets
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_wallets.user_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- BLOCKED_USERS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own blocks" ON public.blocked_users
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = blocked_users.blocker_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can block others" ON public.blocked_users
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = blocked_users.blocker_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can unblock others" ON public.blocked_users
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = blocked_users.blocker_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- FRIENDSHIPS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own friendships" ON public.friendships
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = friendships.requester_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = friendships.addressee_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT WITH CHECK (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = friendships.requester_id AND profiles.user_id = auth.uid()))
    AND (NOT public.has_block_between(requester_id, addressee_id))
  );

CREATE POLICY "Users can update friendships they're part of" ON public.friendships
  FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = friendships.requester_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = friendships.addressee_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Users can delete their own friendships" ON public.friendships
  FOR DELETE USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = friendships.requester_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = friendships.addressee_id AND profiles.user_id = auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- FOLLOWERS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Approved followers are viewable by everyone" ON public.followers
  FOR SELECT USING (
    (status = 'approved'::follow_status)
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = followers.follower_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = followers.following_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Users can follow others" ON public.followers
  FOR INSERT WITH CHECK (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = followers.follower_id AND profiles.user_id = auth.uid()))
    AND (NOT public.has_block_between(follower_id, following_id))
  );

CREATE POLICY "Users can update their follow relationships" ON public.followers
  FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = followers.follower_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = followers.following_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Users can unfollow or remove followers" ON public.followers
  FOR DELETE USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = followers.follower_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = followers.following_id AND profiles.user_id = auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- FOLLOWS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Follows are viewable by everyone" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can create follows" ON public.follows
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = follows.follower_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own follows" ON public.follows
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = follows.follower_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- MESSAGES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = messages.sender_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = messages.recipient_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = messages.sender_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = messages.recipient_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their sent messages" ON public.messages
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = messages.sender_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- CARD_CACHE POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Card cache is viewable by everyone" ON public.card_cache
  FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- USER_CARDS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "User cards are viewable by everyone" ON public.user_cards
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own cards" ON public.user_cards
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_cards.user_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own cards" ON public.user_cards
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_cards.user_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own cards" ON public.user_cards
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_cards.user_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- USER_HAVES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Haves are viewable by everyone" ON public.user_haves
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own haves" ON public.user_haves
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_haves.user_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- USER_WANTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Wants are viewable by everyone" ON public.user_wants
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own wants" ON public.user_wants
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_wants.user_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- MARKETPLACE_LISTINGS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Active listings are viewable by everyone" ON public.marketplace_listings
  FOR SELECT USING (
    (status = 'active'::listing_status)
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = marketplace_listings.seller_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Users can create their own listings" ON public.marketplace_listings
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = marketplace_listings.seller_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own listings" ON public.marketplace_listings
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = marketplace_listings.seller_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own listings" ON public.marketplace_listings
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = marketplace_listings.seller_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- LISTING_OFFERS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view offers they're part of" ON public.listing_offers
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_offers.buyer_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_offers.seller_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Buyers can create offers" ON public.listing_offers
  FOR INSERT WITH CHECK (
    (is_counter = false)
    AND (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_offers.buyer_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Sellers can create counter-offers" ON public.listing_offers
  FOR INSERT WITH CHECK (
    (is_counter = true)
    AND (seller_id = public.get_profile_id(auth.uid()))
    AND public.is_listing_seller(listing_id, seller_id)
    AND public.validate_counter_offer(parent_offer_id, listing_id, buyer_id, seller_id)
  );

CREATE POLICY "Participants can update offers" ON public.listing_offers
  FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_offers.buyer_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_offers.seller_id AND profiles.user_id = auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- LISTING_MESSAGES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their listing messages" ON public.listing_messages
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_messages.sender_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = listing_messages.recipient_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Users can send listing messages" ON public.listing_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = listing_messages.sender_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Recipients can mark messages as read" ON public.listing_messages
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = listing_messages.recipient_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- TRADE_PROPOSALS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own trades" ON public.trade_proposals
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = trade_proposals.proposer_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = trade_proposals.recipient_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Users can create trades" ON public.trade_proposals
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = trade_proposals.proposer_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own trades" ON public.trade_proposals
  FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = trade_proposals.proposer_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = trade_proposals.recipient_id AND profiles.user_id = auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- TRADE_ITEMS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Trade items viewable by trade participants" ON public.trade_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM trade_proposals tp
    WHERE tp.id = trade_items.trade_id
      AND (
        (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = tp.proposer_id AND profiles.user_id = auth.uid()))
        OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = tp.recipient_id AND profiles.user_id = auth.uid()))
      )
  ));

CREATE POLICY "Users can add items to their trades" ON public.trade_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = trade_items.owner_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- TOP_EIGHT POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Top eight is viewable by everyone" ON public.top_eight
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own top eight" ON public.top_eight
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = top_eight.user_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- WALL_POSTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Wall posts are viewable by everyone" ON public.wall_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create wall posts" ON public.wall_posts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = wall_posts.author_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Authors can update their own posts" ON public.wall_posts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = wall_posts.author_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Authors can delete their own posts" ON public.wall_posts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = wall_posts.author_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- WALL_POST_REPLIES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Replies are viewable by everyone" ON public.wall_post_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON public.wall_post_replies
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = wall_post_replies.author_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Authors can delete their own replies" ON public.wall_post_replies
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = wall_post_replies.author_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- GLOBAL_POSTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Global posts are viewable by everyone" ON public.global_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON public.global_posts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = global_posts.author_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own posts" ON public.global_posts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = global_posts.author_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own posts" ON public.global_posts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = global_posts.author_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- KUDOS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Kudos are viewable by everyone" ON public.kudos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create kudos" ON public.kudos
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = kudos.author_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own kudos" ON public.kudos
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = kudos.author_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- ACTIVITY_FEED POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Activity feed is viewable by everyone" ON public.activity_feed
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own activity" ON public.activity_feed
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = activity_feed.user_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- LIVE_STREAMS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Active streams are viewable by everyone" ON public.live_streams
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own streams" ON public.live_streams
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = live_streams.streamer_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- STREAM_CHAT POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Stream chat is viewable by everyone" ON public.stream_chat
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post to stream chat" ON public.stream_chat
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = stream_chat.user_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- GIFT_TRANSACTIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own transactions" ON public.gift_transactions
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = gift_transactions.sender_id AND profiles.user_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = gift_transactions.recipient_id AND profiles.user_id = auth.uid()))
  );

CREATE POLICY "Users can create transactions" ON public.gift_transactions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = gift_transactions.sender_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- TOURNAMENT_EVENTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Tournament events are viewable by everyone" ON public.tournament_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert tournament events" ON public.tournament_events
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tournament events" ON public.tournament_events
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tournament events" ON public.tournament_events
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- USER_EVENT_NOTIFICATIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own notifications" ON public.user_event_notifications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_event_notifications.user_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own notifications" ON public.user_event_notifications
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_event_notifications.user_id AND profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own notifications" ON public.user_event_notifications
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = user_event_notifications.user_id AND profiles.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- SCAN_CACHE POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Scan cache is readable by authenticated users" ON public.scan_cache
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role manages scan cache" ON public.scan_cache
  FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- SCAN_RATE_LIMITS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Rate limits managed by service role" ON public.scan_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('card-images', 'card-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('wall-posts', 'wall-posts', true);

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
