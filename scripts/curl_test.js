const axios = require('axios');
const jwt = require('jsonwebtoken');

async function test() {
    const token = jwt.sign(
        { userId: 'admin-123', role: 'admin' }, 
        'tu_secreto_super_seguro_2024'
    );

    try {
        const res = await axios.put('https://api.cibertmx.org/api/admin/users/da1b5b52-39a3-444f-9372-d8e1b7cd921b/subscription', {
            plan: 'pro',
            role: 'lawyer',
            durationMonths: 2
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('SUCCESS:', res.data);
    } catch (e) {
        console.error('ERROR BODY:', e.response?.data);
    }
}
test();
