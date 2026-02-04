# Lovable to Self-Hosted Supabase Migration

Quick migration script to move your users, data, and images from Lovable's Supabase to your own.

## 🚀 Quick Start

### 1. Get Your Credentials

**Lovable Supabase:**
- URL: Check your old `.env.backup` file (`VITE_SUPABASE_URL`)
- Anon Key: Check your old `.env.backup` file (`VITE_SUPABASE_PUBLISHABLE_KEY`)
- Service Role Key: Go to [Lovable Supabase Dashboard](https://supabase.com) → Settings → API → `service_role` key

**Your New Supabase:**
- URL: Already in your `.env` (`https://upcggxhufxvtuqrxfqvt.supabase.co`)
- Service Role Key: Go to [Supabase Dashboard](https://supabase.com/dashboard/project/upcggxhufxvtuqrxfqvt/settings/api) → Settings → API → `service_role` key

### 2. Edit the Script

Open `migrate-from-lovable.js` and fill in the credentials at the top:

```javascript
const LOVABLE_URL = 'https://uvjulnwoacftborhhhnr.supabase.co';
const LOVABLE_ANON_KEY = 'your-lovable-anon-key';
const LOVABLE_SERVICE_KEY = 'your-lovable-service-key';

const NEW_URL = 'https://upcggxhufxvtuqrxfqvt.supabase.co';
const NEW_SERVICE_KEY = 'your-new-service-key';
```

### 3. Run the Migration

```bash
# Install dependencies
npm install @supabase/supabase-js

# Run the migration
node migrate-from-lovable.js
```

## 📋 What Gets Migrated

✅ **Users** (auth.users)
- Email addresses
- User metadata
- Account status

✅ **Profiles** (profiles table)
- Usernames, bios, avatars
- Social links
- All profile data

✅ **User Data**
- User cards
- Marketplace listings
- Messages
- Friends/follows
- Wall posts
- And more...

✅ **Storage Files**
- `card-images` bucket
- `wall-posts` bucket

## ⚠️ Important Notes

**Passwords Cannot Be Migrated**
- For security reasons, passwords cannot be exported
- After migration, you'll need to send password reset emails to all users
- Go to: Supabase Dashboard → Authentication → Users → Select user → "Send password reset email"

**User IDs**
- The script maintains user relationships by creating a mapping file
- Old user IDs → New user IDs are saved in `exports/user_mapping.json`

**RLS Policies**
- Make sure your Row Level Security policies are configured
- Test with a migrated user account to ensure permissions work

## 🔍 Review Exports First

The script exports everything to `exports/` folder first:
- `users.json` - All user accounts
- `profiles.json` - All profile data
- `user_data.json` - All user-generated content
- `user_mapping.json` - Old → New user ID mapping (created after import)

Review these files before importing!

## 🆘 Troubleshooting

**"Invalid API key" error**
- Double-check your service role keys
- Make sure you're using `service_role`, not `anon` key for admin operations

**"User already exists" error**
- The script handles this gracefully
- Check `exports/user_mapping.json` for details

**Missing files in storage**
- Check bucket names match exactly
- Verify files exist in Lovable storage

**Foreign key constraint errors**
- Some data might reference non-existent users
- Check the logs to see which records failed

## 📞 Next Steps

After migration:
1. ✅ Verify users exist in your Supabase
2. ✅ Test login with a migrated account
3. ✅ Send password reset emails to all users
4. ✅ Check that images are accessible
5. ✅ Test key features (profiles, marketplace, etc.)
6. ✅ Deploy to Netlify!
