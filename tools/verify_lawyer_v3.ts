
import axios from 'axios';

const API_URL = 'http://142.93.186.75:3001';

const lawyerCreds = { email: 'lawyer_pro@test.com', password: '123456' };
const adminCreds = { email: 'admin@test.com', password: '123456' };

async function verifyLawyerV3() {
    console.log('🚀 Starting Lawyer Verification Script V3 (Self-Lookup)...');

    try {
        // 1. LAWYER LOGIN -> GET ID
        console.log('\n👨‍⚖️ Logging in as Lawyer...');
        const lawyerLogin = await axios.post(`${API_URL}/auth/login`, lawyerCreds);
        const lawyerToken = lawyerLogin.data.token;
        console.log(`✅ Lawyer logged in. fetching profile...`);

        const profileRes = await axios.get(`${API_URL}/lawyer-profile/my-profile`, {
            headers: { Authorization: `Bearer ${lawyerToken}` }
        });

        // structure: { id: "profile-uuid", lawyerId: "lawyer-uuid", ... }
        const lawyerId = profileRes.data.lawyerId;
        const profileId = profileRes.data.id;
        console.log(`✅ Lawyer ID found: ${lawyerId}`);
        console.log(`   Profile ID: ${profileId}`);

        // 2. ADMIN LOGIN
        console.log('\n🔐 Logging in as Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, adminCreds);
        const adminToken = adminLogin.data.token;
        console.log(`✅ Admin logged in.`);

        // 3. VERIFY
        console.log(`\n✅ Verifying Lawyer ID: ${lawyerId}...`);
        await axios.put(`${API_URL}/admin/lawyers/${lawyerId}/verify`,
            { isVerified: true },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        console.log('🎉 Lawyer verified successfully! NOW READY FOR FLOW TEST.');

    } catch (error: any) {
        console.error('❌ Verification V3 Failed:', error.response?.data || error.message);
        // If lawyer login failed because "not verified" (unlikely for login, usually only restricted actions), we might be stuck.
        // But usually login allows entry, just restricts actions.
        // If login blocks unverified, we have a Catch-22 and must fix GET /admin/lawyers crash or use raw SQL.
    }
}

verifyLawyerV3();
