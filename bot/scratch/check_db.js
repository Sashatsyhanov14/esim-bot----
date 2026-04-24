
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Checking connection to:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnostic() {
    // 1. Check if we can read users
    const { data: users, error: userError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (userError) {
        console.error('DATABASE ERROR:', userError.message);
        if (userError.message.includes('role')) {
            console.log('Confirmed: Issue is with the roles/constraints.');
        }
    } else {
        console.log('CONNECTION SUCCESS! User count:', users);
    }

    // 2. Check tariffs
    const { data: tariffs, error: tariffError } = await supabase.from('tariffs').select('id').limit(1);
    if (tariffError) {
        console.error('TARIFFS ERROR:', tariffError.message);
    } else {
        console.log('TARIFFS ACCESSIBLE! Found:', tariffs.length);
    }
}

diagnostic();
