-- ============================================
-- USER DATA MIGRATION SCRIPT
-- ============================================
-- IMPORTANT: Auth users (auth.users) cannot be exported from Lovable Cloud.
-- Users will need to re-register on your external Supabase instance.
-- After they register, you'll need to update the user_id references below
-- to match their new auth.users IDs.
--
-- This script contains profile data that references the OLD user_ids.
-- You have two options:
-- 1. Have users re-register, then manually update user_id mappings
-- 2. Use Supabase's admin API to create users with specific IDs (advanced)
-- ============================================

-- ============================================
-- PROFILES DATA (7 users)
-- ============================================
-- Note: You'll need to update user_id values after users re-register

INSERT INTO public.profiles (id, user_id, username, bio, avatar_url, is_live, is_online, status, email_contact, twitter_url, instagram_url, facebook_url, youtube_url, tiktok_url, website_url, rumble_url, spotify_playlist_url, youtube_playlist_url, music_autoplay, last_username_change_at, last_seen_at, created_at, updated_at)
VALUES
  ('57ddd96c-571c-40ce-a578-d29d854f762e', 'a24a29cb-576a-422b-b219-f0aadc1901e4', 'Pepkilla', 'My name is pepkilla and I love TCG and Marvel Cards :) ', 'https://uvjulnwoacftborhhhnr.supabase.co/storage/v1/object/public/card-images/avatars/57ddd96c-571c-40ce-a578-d29d854f762e-1769572218966.png', false, false, 'Creator/CEO ', '', 'https://x.com/Pepkilla1', 'https://instagram/pepkilla', '', 'https://youtube.com/@collectingtcg', '', '', 'https://rumble.com/c/collectingtcg', '', 'https://music.youtube.com/playlist?list=PLyBvPhbWayJuTOMxNm2Cp_SXi9rgVKAcH', true, '2026-01-28 03:48:15.619+00', '2026-02-04 01:58:19.814+00', '2026-01-27 23:14:42.229982+00', '2026-02-04 01:58:25.694504+00'),
  
  ('d0fe988e-e838-4ff0-81e5-ffc4134513f5', 'ebd419d6-e148-4b93-8310-1f0a92145c0b', 'tigress', '', 'https://uvjulnwoacftborhhhnr.supabase.co/storage/v1/object/public/card-images/avatars/d0fe988e-e838-4ff0-81e5-ffc4134513f5-1769624379588.png', false, false, '', '', '', '', '', '', '', '', '', '', 'https://music.youtube.com/playlist?list=PLyBvPhbWayJuTOMxNm2Cp_SXi9rgVKAcH', true, NULL, '2026-02-03 21:11:20.705+00', '2026-01-28 17:40:23.933172+00', '2026-02-03 21:11:22.963901+00'),
  
  ('6a74d3e6-ccff-48c2-8de3-c34c54454920', '31638a67-285c-40f5-a5ac-c47d23ffd6dc', 'Ricky Womack', '', 'https://uvjulnwoacftborhhhnr.supabase.co/storage/v1/object/public/card-images/avatars/6a74d3e6-ccff-48c2-8de3-c34c54454920-1769631947294.jpeg', false, false, '', '', 'https://x.com/RealRickyWomack', '', '', '', '', '', '', '', '', false, NULL, '2026-02-03 20:30:29.999538+00', '2026-01-28 20:24:08.704013+00', '2026-01-28 22:28:13.856022+00'),
  
  ('b1b8f1eb-63b6-46cd-a039-ec208148dbbc', '80404a9c-cd10-4926-b747-7a80c529376a', 'FusedAegis', '', '', false, false, '', '', '', '', '', '', '', '', '', 'https://open.spotify.com/playlist/4UlprovjBSGOmBjZRcnvay?si=0cd5abb662674501', '', false, NULL, '2026-02-03 20:30:29.999538+00', '2026-01-28 20:47:45.310571+00', '2026-01-28 20:48:37.25431+00'),
  
  ('be12e652-764e-4848-ab5f-9d4a32e0c9ec', '845ce37e-ed6b-42cf-b710-790b35a9c3bc', 'Sammyc', '', '', false, false, '', '', '', '', '', '', '', '', '', '', '', false, NULL, '2026-02-03 20:30:29.999538+00', '2026-01-29 22:12:19.01125+00', '2026-01-29 22:12:19.01125+00'),
  
  ('7724e102-e224-4f59-8b71-5e8f9f8cdcf6', '88201d99-9b7a-49bc-b392-a56dc2f79488', 'Pepkirra the original', '', '', false, false, '', '', '', '', '', '', '', '', '', '', '', false, NULL, '2026-02-03 20:30:29.999538+00', '2026-01-31 17:58:11.102435+00', '2026-01-31 17:58:11.102435+00'),
  
  ('88735f14-40db-4946-9f7f-d00f2429b13f', 'f6e21021-dcbc-4794-9aa6-7104daf2adf6', 'tacticaltigress', '', '', false, false, '', '', '', '', '', '', '', '', '', '', '', false, NULL, '2026-02-03 22:10:13.326+00', '2026-02-03 21:33:51.88497+00', '2026-02-03 22:10:17.629643+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- USER SETTINGS DATA
-- ============================================

INSERT INTO public.user_settings (id, user_id, profile_visibility, messaging_privacy, friend_request_permission, follow_permission, show_online_status, created_at, updated_at)
VALUES
  ('f280a98c-c1ca-4bb1-bca5-5318458dca75', '57ddd96c-571c-40ce-a578-d29d854f762e', 'public', 'friends_only', 'everyone', 'everyone', true, '2026-01-28 03:25:41.909605+00', '2026-02-03 21:02:43.046199+00'),
  ('875b1c36-70f5-4191-8e42-c4ae8170b853', 'd0fe988e-e838-4ff0-81e5-ffc4134513f5', 'public', 'open', 'everyone', 'everyone', true, '2026-01-28 17:40:32.783135+00', '2026-01-28 17:40:32.783135+00'),
  ('8fd1ce68-04c0-44ae-b6f4-a07618910034', '6a74d3e6-ccff-48c2-8de3-c34c54454920', 'public', 'open', 'everyone', 'everyone', true, '2026-01-28 20:24:43.305879+00', '2026-01-28 20:24:43.305879+00'),
  ('df93e538-4963-408e-bbe8-360ec199ba1e', 'b1b8f1eb-63b6-46cd-a039-ec208148dbbc', 'public', 'friends_only', 'everyone', 'everyone', true, '2026-01-28 20:48:07.021069+00', '2026-01-28 20:54:40.32682+00'),
  ('57faa61c-0c38-4aae-ad2a-cb5cded0501a', 'be12e652-764e-4848-ab5f-9d4a32e0c9ec', 'public', 'open', 'everyone', 'everyone', true, '2026-01-29 22:13:14.171064+00', '2026-01-29 22:13:14.171064+00'),
  ('9b3a36aa-ed9c-4875-a5aa-50db8dbd077c', '7724e102-e224-4f59-8b71-5e8f9f8cdcf6', 'public', 'open', 'everyone', 'everyone', true, '2026-01-31 17:58:17.272663+00', '2026-01-31 17:58:17.272663+00'),
  ('d596fa14-3e26-4dd5-97e8-0a9d5c3bdcde', '88735f14-40db-4946-9f7f-d00f2429b13f', 'public', 'open', 'everyone', 'everyone', true, '2026-02-03 21:34:01.048313+00', '2026-02-03 21:34:01.048313+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- USER WALLETS DATA
-- ============================================

INSERT INTO public.user_wallets (id, user_id, eco_credits, earned_balance, created_at, updated_at)
VALUES
  ('e4150fe0-fda5-41e4-939d-71dc1704b15a', '57ddd96c-571c-40ce-a578-d29d854f762e', 0, 0.00, '2026-01-28 17:26:09.023205+00', '2026-01-28 17:26:09.023205+00'),
  ('509a8495-d0dd-4cef-913d-2e8106ba6487', 'd0fe988e-e838-4ff0-81e5-ffc4134513f5', 0, 0.00, '2026-01-28 17:40:24.996908+00', '2026-01-28 17:40:24.996908+00'),
  ('c11adfb3-4078-4b2e-a7f7-375b5728c28a', '6a74d3e6-ccff-48c2-8de3-c34c54454920', 0, 0.00, '2026-01-28 20:24:09.89287+00', '2026-01-28 20:24:09.89287+00'),
  ('669becb7-f3c2-4f39-8331-0ee6d35b6c57', 'b1b8f1eb-63b6-46cd-a039-ec208148dbbc', 0, 0.00, '2026-01-28 20:47:46.080161+00', '2026-01-28 20:47:46.080161+00'),
  ('68176bcf-8297-43bf-8891-b3a20fc73ef9', 'be12e652-764e-4848-ab5f-9d4a32e0c9ec', 0, 0.00, '2026-01-29 22:12:19.711359+00', '2026-01-29 22:12:19.711359+00'),
  ('e1f140c7-aa56-4788-8021-90445045a492', '7724e102-e224-4f59-8b71-5e8f9f8cdcf6', 0, 0.00, '2026-01-31 17:58:12.079772+00', '2026-01-31 17:58:12.079772+00'),
  ('f2356ce2-9104-4ee9-87ae-6d97907b79fa', '88735f14-40db-4946-9f7f-d00f2429b13f', 0, 0.00, '2026-02-03 21:33:52.86243+00', '2026-02-03 21:33:52.86243+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- USER ID MAPPING REFERENCE
-- ============================================
-- Use this to map old user_ids to new ones after users re-register:
--
-- Username: Pepkilla
--   Old profile_id: 57ddd96c-571c-40ce-a578-d29d854f762e
--   Old user_id: a24a29cb-576a-422b-b219-f0aadc1901e4
--
-- Username: tigress
--   Old profile_id: d0fe988e-e838-4ff0-81e5-ffc4134513f5
--   Old user_id: ebd419d6-e148-4b93-8310-1f0a92145c0b
--
-- Username: Ricky Womack
--   Old profile_id: 6a74d3e6-ccff-48c2-8de3-c34c54454920
--   Old user_id: 31638a67-285c-40f5-a5ac-c47d23ffd6dc
--
-- Username: FusedAegis
--   Old profile_id: b1b8f1eb-63b6-46cd-a039-ec208148dbbc
--   Old user_id: 80404a9c-cd10-4926-b747-7a80c529376a
--
-- Username: Sammyc
--   Old profile_id: be12e652-764e-4848-ab5f-9d4a32e0c9ec
--   Old user_id: 845ce37e-ed6b-42cf-b710-790b35a9c3bc
--
-- Username: Pepkirra the original
--   Old profile_id: 7724e102-e224-4f59-8b71-5e8f9f8cdcf6
--   Old user_id: 88201d99-9b7a-49bc-b392-a56dc2f79488
--
-- Username: tacticaltigress
--   Old profile_id: 88735f14-40db-4946-9f7f-d00f2429b13f
--   Old user_id: f6e21021-dcbc-4794-9aa6-7104daf2adf6
