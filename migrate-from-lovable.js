// Complete Migration Script for Lovable → Self-Hosted Supabase
// This script migrates users, profiles, and storage files

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

// ===== CONFIGURATION =====
// Fill these in with your credentials

// OLD LOVABLE SUPABASE
const LOVABLE_URL = 'https://uvjulnwoacftborhhhnr.supabase.co';
const LOVABLE_ANON_KEY = 'YOUR_LOVABLE_ANON_KEY'; // Get from Lovable .env
const LOVABLE_SERVICE_KEY = 'YOUR_LOVABLE_SERVICE_ROLE_KEY'; // Get from Lovable dashboard

// NEW SELF-HOSTED SUPABASE
const NEW_URL = 'https://upcggxhufxvtuqrxfqvt.supabase.co';
const NEW_SERVICE_KEY = 'YOUR_NEW_SERVICE_ROLE_KEY'; // Get from your Supabase dashboard → Settings → API

// =========================

// Create clients
const lovableSupabase = createClient(LOVABLE_URL, LOVABLE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const lovableAnonSupabase = createClient(LOVABLE_URL, LOVABLE_ANON_KEY);

const newSupabase = createClient(NEW_URL, NEW_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ===== STEP 1: Export Users =====
async function exportUsers() {
    console.log('\n📥 Exporting users from Lovable...');

    const { data, error } = await lovableSupabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
    }

    console.log(`✅ Found ${data.users.length} users`);
    await fs.writeFile('exports/users.json', JSON.stringify(data.users, null, 2));
    console.log('💾 Saved to exports/users.json');

    return data.users;
}

// ===== STEP 2: Export Profiles =====
async function exportProfiles() {
    console.log('\n📥 Exporting profiles from Lovable...');

    const { data, error } = await lovableAnonSupabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('❌ Error fetching profiles:', error);
        throw error;
    }

    console.log(`✅ Found ${data.length} profiles`);
    await fs.writeFile('exports/profiles.json', JSON.stringify(data, null, 2));
    console.log('💾 Saved to exports/profiles.json');

    return data;
}

// ===== STEP 3: Export User Data =====
async function exportUserData() {
    console.log('\n📥 Exporting user data from Lovable...');

    const tables = [
        'user_cards',
        'user_haves',
        'user_wants',
        'user_wallets',
        'user_settings',
        'marketplace_listings',
        'friendships',
        'follows',
        'messages',
        'wall_posts',
        'global_posts'
    ];

    const exports = {};

    for (const table of tables) {
        try {
            const { data, error } = await lovableAnonSupabase
                .from(table)
                .select('*');

            if (error) {
                console.log(`⚠️  Skipping ${table}: ${error.message}`);
                continue;
            }

            exports[table] = data;
            console.log(`✅ Exported ${data.length} records from ${table}`);
        } catch (err) {
            console.log(`⚠️  Skipping ${table}: ${err.message}`);
        }
    }

    await fs.writeFile('exports/user_data.json', JSON.stringify(exports, null, 2));
    console.log('💾 Saved to exports/user_data.json');

    return exports;
}

// ===== STEP 4: Import Users =====
async function importUsers(users) {
    console.log('\n📤 Importing users to new Supabase...');

    const results = {
        success: [],
        failed: []
    };

    for (const user of users) {
        try {
            const { data, error } = await newSupabase.auth.admin.createUser({
                email: user.email,
                email_confirm: true,
                user_metadata: user.user_metadata || {},
                app_metadata: user.app_metadata || {},
            });

            if (error) {
                console.error(`❌ Failed ${user.email}:`, error.message);
                results.failed.push({ email: user.email, error: error.message });
            } else {
                console.log(`✅ Imported ${user.email}`);
                results.success.push({
                    oldId: user.id,
                    newId: data.user.id,
                    email: user.email
                });
            }
        } catch (err) {
            console.error(`❌ Failed ${user.email}:`, err.message);
            results.failed.push({ email: user.email, error: err.message });
        }
    }

    await fs.writeFile('exports/user_mapping.json', JSON.stringify(results, null, 2));
    console.log(`\n✅ Success: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    return results;
}

// ===== STEP 5: Import Profiles =====
async function importProfiles(profiles, userMapping) {
    console.log('\n📤 Importing profiles to new Supabase...');

    if (!userMapping || userMapping.success.length === 0) {
        console.log('⚠️  No user mapping found. Skipping profile import.');
        return;
    }

    // Create a map of old user_id to new user_id
    const idMap = {};
    userMapping.success.forEach(u => {
        idMap[u.oldId] = u.newId;
    });

    // Update profiles with new user IDs
    const updatedProfiles = profiles
        .filter(p => idMap[p.user_id])
        .map(p => ({
            ...p,
            user_id: idMap[p.user_id],
            id: idMap[p.id] || p.id // Update the profile ID to match new user ID if they're the same
        }));

    if (updatedProfiles.length === 0) {
        console.log('⚠️  No profiles to import.');
        return;
    }

    // Import in batches of 100
    const batchSize = 100;
    for (let i = 0; i < updatedProfiles.length; i += batchSize) {
        const batch = updatedProfiles.slice(i, i + batchSize);

        const { error } = await newSupabase
            .from('profiles')
            .upsert(batch, { onConflict: 'user_id' });

        if (error) {
            console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error);
        } else {
            console.log(`✅ Imported batch ${i / batchSize + 1} (${batch.length} profiles)`);
        }
    }

    console.log(`✅ Profile import complete`);
}

// ===== STEP 6: Migrate Storage Files =====
async function migrateStorage(bucketName) {
    console.log(`\n📥 Migrating storage bucket: ${bucketName}`);

    // Create bucket in new Supabase (ignore error if exists)
    await newSupabase.storage.createBucket(bucketName, { public: true });

    // List all files
    const { data: files, error: listError } = await lovableAnonSupabase
        .storage
        .from(bucketName)
        .list();

    if (listError) {
        console.error(`❌ Error listing files in ${bucketName}:`, listError);
        return;
    }

    if (!files || files.length === 0) {
        console.log(`⚠️  No files found in ${bucketName}`);
        return;
    }

    console.log(`Found ${files.length} files to migrate`);

    let success = 0;
    let failed = 0;

    for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue;

        try {
            // Download from old
            const { data: fileData, error: downloadError } = await lovableAnonSupabase
                .storage
                .from(bucketName)
                .download(file.name);

            if (downloadError) {
                console.error(`❌ Download failed for ${file.name}`);
                failed++;
                continue;
            }

            // Upload to new
            const { error: uploadError } = await newSupabase
                .storage
                .from(bucketName)
                .upload(file.name, fileData, {
                    contentType: file.metadata?.mimetype,
                    upsert: true
                });

            if (uploadError) {
                console.error(`❌ Upload failed for ${file.name}:`, uploadError.message);
                failed++;
            } else {
                console.log(`✅ Migrated ${file.name}`);
                success++;
            }
        } catch (err) {
            console.error(`❌ Error with ${file.name}:`, err.message);
            failed++;
        }
    }

    console.log(`\n${bucketName} - Success: ${success}, Failed: ${failed}`);
}

// ===== MAIN MIGRATION FUNCTION =====
async function runMigration() {
    console.log('🚀 Starting Lovable → Self-Hosted Supabase Migration\n');
    console.log('⚠️  Make sure you have filled in all credentials at the top of this file!\n');

    try {
        // Create exports directory
        await fs.mkdir('exports', { recursive: true });

        // Step 1: Export everything from Lovable
        const users = await exportUsers();
        const profiles = await exportProfiles();
        const userData = await exportUserData();

        console.log('\n✅ Export complete!\n');
        console.log('Now review the exported data in the exports/ folder.');
        console.log('\nReady to import? Press Ctrl+C to cancel or wait 5 seconds...');

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 2: Import users
        const userMapping = await importUsers(users);

        // Step 3: Import profiles
        await importProfiles(profiles, userMapping);

        // Step 4: Migrate storage
        await migrateStorage('card-images');
        await migrateStorage('wall-posts');

        console.log('\n🎉 Migration complete!');
        console.log('\n⚠️  IMPORTANT: Users will need to reset their passwords!');
        console.log('Go to your Supabase dashboard → Authentication → Users');
        console.log('and send password reset emails to all users.\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
