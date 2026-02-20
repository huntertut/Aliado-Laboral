
import axios from 'axios';

const API_URL = 'http://142.93.186.75:3001';

const workerCreds = { email: 'worker_premium@test.com', password: '123456' };

async function testWorkerFlow() {
    console.log('🚀 Testing Worker Side Flow (Partial)...');

    try {
        // 1. LOGIN
        console.log('\n🔐 Logging in as Worker...');
        const workerLogin = await axios.post(`${API_URL}/auth/login`, workerCreds);
        const workerToken = workerLogin.data.token;
        console.log(`✅ Worker Logged In: ${workerLogin.data.user.email}`);

        // 2. CREATE REQUEST
        console.log('\n📝 Creating Contact Request...');
        const requestPayload = {
            // Need a lawyerProfileId. I'll use a hardcoded one if I can guess it or just try without it?
            // Schema says lawyerProfileId is required.
            // I need to fetch a lawyer to get their profile ID.
            // Public endpoint?
        };

        // Try to fetch public lawyers to get a target
        console.log('🔎 Finding a lawyer to request...');
        const publicLawyers = await axios.get(`${API_URL}/lawyer-profile/public`);
        if (publicLawyers.data.lawyers.length === 0) {
            console.error('❌ No public lawyers found to contact.');
            return;
        }

        const targetLawyer = publicLawyers.data.lawyers[0];
        console.log(`✅ Target found: ${targetLawyer.name} (Profile: ${targetLawyer.id})`);

        const createRes = await axios.post(`${API_URL}/contact`, {
            lawyerProfileId: targetLawyer.id,
            caseSummary: 'Test Case from Auto-Script',
            caseType: 'despido',
            urgency: 'normal'
        }, {
            headers: { Authorization: `Bearer ${workerToken}` }
        });

        console.log(`✅ Request Created! ID: ${createRes.data.contactRequest.id}`);
        console.log('🎉 Worker Side is WORKING.');

    } catch (error: any) {
        console.error('❌ Worker Test Failed:', error.response?.data || error.message);
    }
}

testWorkerFlow();
