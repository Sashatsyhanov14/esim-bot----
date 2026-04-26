const { getTariffs } = require('./src/supabase');

async function check() {
    const { data } = await getTariffs();
    console.log(JSON.stringify(data, null, 2));
}

check();
