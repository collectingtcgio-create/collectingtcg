-- Add social media and contact fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_contact text DEFAULT '',
ADD COLUMN IF NOT EXISTS tiktok_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS twitter_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS facebook_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS website_url text DEFAULT '';