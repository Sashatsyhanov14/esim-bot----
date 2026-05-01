const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    try {
        const { data: tariffs, error } = await supabase.from('tariffs').select('*');
        if (error) {
            console.error('Error fetching tariffs:', error);
        } else {
            console.log('Tariffs Count:', tariffs?.length);
            console.log('Tariffs:', JSON.stringify(tariffs, null, 2));
        }
    } catch (e) {
        console.error('Crash:', e);
    }
}

check();
