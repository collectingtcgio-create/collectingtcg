#!/usr/bin/env node

/**
 * CSV to Supabase Import Script
 * Imports user data from Lovable CSV exports into your self-hosted Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your new Supabase credentials
const SUPABASE_URL = 'https://upcggxhufxvtuqrxfqvt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Simple CSV parser
function parseCSV(csvContent, delimiter = ';') {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(delimiter);

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter);
        const row = {};

        headers.forEach((header, index) => {
            let value = values[index] || '';

            // Handle empty values
            if (value === '' || value === 'null') {
                row[header] = null;
            }
            // Handle JSON strings (user metadata)
            else if (value.startsWith('"{') && value.endsWith('}"')) {
                try {
                    // Remove outer quotes and unescape
                    const cleaned = value.slice(1, -1).replace(/""/g, '"');
                    row[header] = JSON.parse(cleaned);
                } catch (e) {
                    row[header] = value;
                }
            }
            // Handle booleans
            else if (value === 'true') {
                row[header] = true;
            } else if (value === 'false') {
                row[header] = false;
            }
            // Keep as string
            else {
                row[header] = value;
            }
        });

        data.push(row);
    }

    return data;
}

// Import users (auth.users)
async function importUsers() {
    console.log('\n📥 Importing Users (Authentication)...');

    const csvPath = path.join(__dirname, 'lovemigration', 'User-Authentication-Data-query-results-export-2026-02-03_23-20-37.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const users = parseCSV(csvContent);

    console.log(`Found ${users.length} users to import`);

    const results = { success: [], failed: [], skipped: [] };

    // First, get existing users to create a mapping
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingEmails = new Map();
    if (existingUsers && existingUsers.users) {
        existingUsers.users.forEach(u => {
            existingEmails.set(u.email, u.id);
        });
    }

    for (const user of users) {
        try {
            // Check if user already exists
            if (existingEmails.has(user.email)) {
                const existingId = existingEmails.get(user.email);
                console.log(`⏩ ${user.email} already exists, using existing ID`);
                results.skipped.push({
                    oldId: user.id,
                    newId: existingId,
                    email: user.email,
                    note: 'already existed'
                });
                continue;
            }

            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                email_confirm: true,
                user_metadata: user.raw_user_meta_data || {},
                app_metadata: user.raw_app_meta_data || {},
            });

            if (error) {
                console.error(`❌ Failed ${user.email}:`, error.message);
                results.failed.push({ email: user.email, oldId: user.id, error: error.message });
            } else {
                console.log(`✅ Imported ${user.email}`);
                results.success.push({
                    oldId: user.id,
                    newId: data.user.id,
                    email: user.email
                });
            }
        } catch (err) {
            console.error(`❌ Error with ${user.email}:`, err.message);
            results.failed.push({ email: user.email, oldId: user.id, error: err.message });
        }
    }

    console.log(`\n✅ Created: ${results.success.length}`);
    console.log(`⏩ Skipped (existing): ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    // Combine success and skipped for the mapping
    const allMapped = [...results.success, ...results.skipped];

    // Save mapping
    fs.writeFileSync(
        path.join(__dirname, 'lovemigration', 'user_id_mapping.json'),
        JSON.stringify({ success: allMapped, failed: results.failed, skipped: results.skipped.length }, null, 2)
    );

    return { ...results, success: allMapped };
}

// Import profiles
async function importProfiles(userMapping) {
    console.log('\n📥 Importing Profiles...');

    const csvPath = path.join(__dirname, 'lovemigration', 'User-Profiles-query-results-export-2026-02-03_23-21-58.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const profiles = parseCSV(csvContent);

    console.log(`Found ${profiles.length} profiles to import`);

    if (!userMapping || !userMapping.success || userMapping.success.length === 0) {
        console.log('⚠️  No user mapping available. Cannot import profiles.');
        return;
    }

    // Create mapping from old user_id to new user_id
    const idMap = {};
    userMapping.success.forEach(u => {
        if (u.oldId && u.newId) {
            idMap[u.oldId] = u.newId;
        }
    });

    const batchSize = 10;
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize);

        // Clean up profiles - remove old storage URLs and map user IDs
        const cleanedBatch = batch.map(p => {
            let avatar_url = p.avatar_url;
            if (avatar_url && avatar_url.includes('uvjulnwoacftborhhhnr.supabase.co')) {
                const match = avatar_url.match(/\/storage\/v1\/object\/public\/(.+)/);
                if (match) {
                    avatar_url = `${SUPABASE_URL}/storage/v1/object/public/${match[1]}`;
                }
            }

            // Map old user_id to new user_id
            const newUserId = idMap[p.user_id];
            if (!newUserId) {
                console.log(`⚠️  Skipping profile for unmapped user_id: ${p.user_id}`);
                return null;
            }

            return {
                id: newUserId, // Use new user ID as profile ID
                user_id: newUserId,
                username: p.username,
                bio: p.bio,
                avatar_url,
                status: p.status,
                email_contact: p.email_contact,
                twitter_url: p.twitter_url,
                instagram_url: p.instagram_url,
                facebook_url: p.facebook_url,
                youtube_url: p.youtube_url,
                tiktok_url: p.tiktok_url,
                website_url: p.website_url,
                rumble_url: p.rumble_url,
                spotify_playlist_url: p.spotify_playlist_url,
                youtube_playlist_url: p.youtube_playlist_url,
                music_autoplay: p.music_autoplay,
                is_live: p.is_live,
                is_online: p.is_online,
                last_seen_at: p.last_seen_at,
                last_username_change_at: p.last_username_change_at
            };
        }).filter(p => p !== null); // Remove null entries

        if (cleanedBatch.length === 0) {
            continue;
        }

        const { error } = await supabase
            .from('profiles')
            .upsert(cleanedBatch, { onConflict: 'user_id', ignoreDuplicates: false });

        if (error) {
            console.error(`❌ Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
            failed += batch.length;
        } else {
            console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1} (${cleanedBatch.length} profiles)`);
            imported += cleanedBatch.length;
        }
    }

    console.log(`\n✅ Imported: ${imported}`);
    console.log(`❌ Failed: ${failed}`);
}

// Import user cards
async function importUserCards(userMapping) {
    console.log('\n📥 Importing User Cards...');

    const csvPath = path.join(__dirname, 'lovemigration', 'user-cards-query-results-export-2026-02-03_23-22-51.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const cards = parseCSV(csvContent);

    console.log(`Found ${cards.length} cards to import`);

    if (!userMapping || !userMapping.success || userMapping.success.length === 0) {
        console.log('⚠️  No user mapping available. Cannot import user cards.');
        return;
    }

    // Create mapping from old user_id to new user_id
    const idMap = {};
    userMapping.success.forEach(u => {
        if (u.oldId && u.newId) {
            idMap[u.oldId] = u.newId;
        }
    });

    // Get a fallback user ID (use the first successful user)
    const fallbackUserId = userMapping.success[0].newId;
    console.log(`ℹ️  Using fallback user ID for orphans: ${fallbackUserId} (${userMapping.success[0].email})`);

    const batchSize = 100;
    let imported = 0;
    let failed = 0;
    let orphaned = 0;

    for (let i = 0; i < cards.length; i += batchSize) {
        const batch = cards.slice(i, i + batchSize);

        // Map user IDs and clean up data
        const cleanedBatch = batch.map(c => {
            let newUserId = idMap[c.user_id];

            // Handle orphan records by assigning to fallback user
            if (!newUserId) {
                orphaned++;
                newUserId = fallbackUserId;
            }

            return {
                id: c.id,
                user_id: newUserId,
                card_name: c.card_name,
                quantity: c.quantity ? parseInt(c.quantity, 10) : null,
                tcg_game: (c.tcg_game && c.tcg_game.length > 2) ? c.tcg_game : 'onepiece', // Default to onepiece if missing/invalid
                price_estimate: c.price_estimate ? parseFloat(c.price_estimate) : null,
                image_url: c.image_url,
                card_cache_id: c.card_cache_id || null,
                created_at: c.created_at
            };
        }).filter(c => c !== null);

        if (cleanedBatch.length === 0) {
            continue;
        }

        const { error } = await supabase
            .from('user_cards')
            .upsert(cleanedBatch);

        if (error) {
            console.error(`❌ Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
            failed += batch.length;
        } else {
            console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1} (${cleanedBatch.length} cards)`);
            imported += cleanedBatch.length;
        }
    }

    console.log(`\n✅ Imported: ${imported}`);
    if (orphaned > 0) console.log(`⚠️  Orphan records mapped to fallback: ${orphaned}`);
    console.log(`❌ Failed: ${failed}`);
}

// Import marketplace listings
async function importMarketplaceListings(userMapping) {
    console.log('\n📥 Importing Marketplace Listings...');

    const csvPath = path.join(__dirname, 'lovemigration', 'marketplace-listings-query-results-export-2026-02-03_23-23-25.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const listings = parseCSV(csvContent);

    console.log(`Found ${listings.length} listings to import`);

    if (!userMapping || !userMapping.success || userMapping.success.length === 0) {
        console.log('⚠️  No user mapping available. Cannot import listings.');
        return;
    }

    // Create mapping from old user_id to new user_id
    const idMap = {};
    userMapping.success.forEach(u => {
        if (u.oldId && u.newId) {
            idMap[u.oldId] = u.newId;
        }
    });

    // Get a fallback user ID (use the first successful user)
    const fallbackUserId = userMapping.success[0].newId;

    const batchSize = 50;
    let imported = 0;
    let failed = 0;
    let orphaned = 0;

    for (let i = 0; i < listings.length; i += batchSize) {
        const batch = listings.slice(i, i + batchSize);

        // Map user IDs (listings use seller_id)
        const cleanedBatch = batch.map(l => {
            const oldUserId = l.seller_id || l.user_id;
            let newUserId = idMap[oldUserId];

            // Handle orphan records
            if (!newUserId) {
                orphaned++;
                newUserId = fallbackUserId;
            }

            return {
                ...l,
                seller_id: newUserId
            };
        }).filter(l => l !== null);

        if (cleanedBatch.length === 0) {
            continue;
        }

        const { error } = await supabase
            .from('marketplace_listings')
            .upsert(cleanedBatch);

        if (error) {
            console.error(`❌ Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
            failed += batch.length;
        } else {
            console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1} (${cleanedBatch.length} listings)`);
            imported += cleanedBatch.length;
        }
    }

    console.log(`\n✅ Imported: ${imported}`);
    if (orphaned > 0) console.log(`⚠️  Orphan records mapped to fallback: ${orphaned}`);
    console.log(`❌ Failed: ${failed}`);
}

// Main function
async function main() {
    console.log('🚀 Starting CSV Import to Supabase\n');

    if (SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
        console.error('❌ Please set your SUPABASE_SERVICE_KEY environment variable!');
        console.log('\nUsage:');
        console.log('  SUPABASE_SERVICE_KEY=your-key node import-from-csv.js');
        process.exit(1);
    }

    try {
        // Step 1: Import users
        const userMapping = await importUsers();

        // Step 2: Import profiles
        await importProfiles(userMapping);

        // Step 3: Import user cards
        await importUserCards(userMapping);

        // Step 4: Import marketplace listings
        await importMarketplaceListings(userMapping);

        console.log('\n🎉 Import Complete!');
        console.log('\n⚠️  Next steps:');
        console.log('1. Verify data in your Supabase dashboard');
        console.log('2. Send password reset emails to all users');
        console.log('3. Migrate storage files (avatars/images)');
        console.log('4. Test logging in with a migrated user\n');

    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

// Run it!
main();

export { main, importUsers, importProfiles, importUserCards, importMarketplaceListings };
