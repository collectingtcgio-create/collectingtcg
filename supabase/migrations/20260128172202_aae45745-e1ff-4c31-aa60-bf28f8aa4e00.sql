-- Add gift_type to wall_post_replies to track gifted comments
ALTER TABLE public.wall_post_replies 
ADD COLUMN gift_type public.gift_type DEFAULT NULL;

-- Add index for efficient filtering of gifted replies
CREATE INDEX idx_wall_post_replies_gift_type ON public.wall_post_replies(gift_type) WHERE gift_type IS NOT NULL;