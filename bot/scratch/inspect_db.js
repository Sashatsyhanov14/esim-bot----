const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log('Inspecting orders table...');
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) {
        console.error('Error fetching orders:', error.message);
    } else {
        console.log('Order sample columns:', Object.keys(data[0] || {}));
        if (data[0]) console.log('Order status:', data[0].status);
    }

    console.log('Inspecting tariffs table...');
    const { data: tData, error: tError } = await supabase.from('tariffs').select('*').limit(1);
    if (tError) {
        console.error('Error fetching tariffs:', tError.message);
    } else {
        console.log('Tariff sample columns:', Object.keys(tData[0] || {}));
    }

    console.log('Inspecting users table...');
    const { data: uData, error: uError } = await supabase.from('users').select('*').limit(1);
    if (uError) {
        console.error('Error fetching users:', uError.message);
    } else {
        console.log('User sample columns:', Object.keys(uData[0] || {}));
    }
}

inspectTable();
