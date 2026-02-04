-- Cleanup script for fresh migration
-- Run this in Supabase SQL Editor to clear existing data

-- WARNING: This will delete ALL existing data in these tables
-- Make sure you have backups before running!

BEGIN;

-- Delete marketplace listings first (foreign key to user_cards)
DELETE FROM marketplace_listings;

-- Delete user cards
DELETE FROM user_cards;

-- Delete profiles (has foreign key to auth.users)
DELETE FROM profiles;

-- Delete auth users (this cascades to related tables)
-- Note: This requires service role permissions in Supabase
DELETE FROM auth.users;

COMMIT;

-- Verify cleanup
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'user_cards', COUNT(*) FROM user_cards
UNION ALL
SELECT 'marketplace_listings', COUNT(*) FROM marketplace_listings;
