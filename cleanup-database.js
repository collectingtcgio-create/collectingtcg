#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Cleans all migrated data from Supabase to prepare for fresh migration
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://upcggxhufxvtuqrxfqvt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function cleanDatabase() {
    console.log('🧹 Starting database cleanup...\n');

    if (SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
        console.error('❌ Please set your SUPABASE_SERVICE_KEY environment variable!');
        process.exit(1);
    }

    try {
        // Delete marketplace listings first (has FK to user_cards)
        console.log('Deleting marketplace_listings...');
        const { error: listingsError } = await supabase
            .from('marketplace_listings')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (listingsError) {
            console.log('⚠️  marketplace_listings:', listingsError.message);
        } else {
            console.log('✅ Deleted marketplace_listings');
        }

        // Delete user cards
        console.log('Deleting user_cards...');
        const { error: cardsError } = await supabase
            .from('user_cards')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (cardsError) {
            console.log('⚠️  user_cards:', cardsError.message);
        } else {
            console.log('✅ Deleted user_cards');
        }

        // Delete profiles
        console.log('Deleting profiles...');
        const { error: profilesError } = await supabase
            .from('profiles')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (profilesError) {
            console.log('⚠️  profiles:', profilesError.message);
        } else {
            console.log('✅ Deleted profiles');
        }

        // List all users to delete them
        console.log('Deleting auth.users...');
        const { data: users } = await supabase.auth.admin.listUsers();

        if (users && users.users.length > 0) {
            for (const user of users.users) {
                const { error } = await supabase.auth.admin.deleteUser(user.id);
                if (error) {
                    console.log(`⚠️  Failed to delete ${user.email}:`, error.message);
                } else {
                    console.log(`✅ Deleted user ${user.email}`);
                }
            }
        } else {
            console.log('ℹ️  No users to delete');
        }

        console.log('\n✨ Database cleanup complete!\n');

        // Verify cleanup
        console.log('Verifying cleanup...');
        const { data: remainingUsers } = await supabase.auth.admin.listUsers();
        console.log(`Users: ${remainingUsers?.users.length || 0}`);

        const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        console.log(`Profiles: ${profilesCount || 0}`);

        const { count: cardsCount } = await supabase.from('user_cards').select('*', { count: 'exact', head: true });
        console.log(`User cards: ${cardsCount || 0}`);

        const { count: listingsCount } = await supabase.from('marketplace_listings').select('*', { count: 'exact', head: true });
        console.log(`Marketplace listings: ${listingsCount || 0}`);

    } catch (error) {
        console.error('\n❌ Cleanup failed:', error.message);
        process.exit(1);
    }
}

// Run cleanup
cleanDatabase();
