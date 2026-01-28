-- Add quantity column to user_cards table
ALTER TABLE public.user_cards 
ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Add a check constraint to ensure quantity is at least 1
ALTER TABLE public.user_cards 
ADD CONSTRAINT user_cards_quantity_positive CHECK (quantity >= 1);