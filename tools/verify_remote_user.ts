import axios from 'axios';

const API_URL = 'http://142.93.186.75:3001';

// A fresh user guaranteed to be Premium
const freshUser = {
    email: 'worker_gold@test.com',
    password: '123456',
    fullName: 'Trabajador Gold (Nube)',
    role: 'worker',
    plan: 'premium'
};

const fix = async () => {
    console.log(`🔧 Fixing Remote User at ${API_URL}...`);

    try {
        // 1. Try Registering new guaranteed user
        try {
            await axios.post(`${API_URL}/auth/register`, freshUser);
            console.log(`✅ Created FRESH user: ${freshUser.email}`);
        } catch (e: any) {
            console.log(`⚠️ Could not register fresh user (might exist): ${e.message}`);
        }

        // 2. Try Login to verify plan
        console.log(`🔑 Logging in as ${freshUser.email}...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: freshUser.email,
            password: freshUser.password
        });

        const token = loginRes.data.token;
        const user = loginRes.data.user;
        console.log(`📋 User Plan from Server: ${user.plan}`);

        if (user.plan !== 'premium' && user.plan !== 'worker_premium') {
            console.error(`❌ CRITICAL: User is meant to be PREMIUM but server says: ${user.plan}`);
            // Logic to force upgrade would go here if API supported it
        } else {
            console.log(`✅ VERIFIED: User is Premium!`);
        }

    } catch (error: any) {
        console.error('FAILED:', error.message, error.response?.data);
    }
};

fix();
