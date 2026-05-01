const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://localhost:3007/api/web-order', {
            contact: '@test_agent',
            tariffId: '142bc04a-50fa-4054-9474-0834e50403c2'
        });
        console.log('Success:', res.data);
    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}

test();
