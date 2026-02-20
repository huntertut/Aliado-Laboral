
import axios from 'axios';

const API_URL = 'http://142.93.186.75:3001';

const adminCreds = { email: 'admin@test.com', password: '123456' };
const newLawyer = {
    email: `lawyer_test_${Date.now()}@test.com`,
    password: '123456',
    fullName: 'Abogado Test Automático',
    role: 'lawyer',
    licenseNumber: `CED${Date.now()}`,
    specialty: 'Laboral'
};

async function setupVerifiedLawyer() {
    console.log('🚀 Starting "Trojan Horse" Verification Strategy...');

    try {
        // 1. REGISTER NEW LAWYER
        console.log(`\n📝 Registering new lawyer: ${newLawyer.email}...`);
        const regRes = await axios.post(`${API_URL}/auth/register`, newLawyer);
        const userToken = regRes.data.token;
        console.log(`✅ Registered! Token received.`);

        // 2. GET LAWYER ID (Self-Lookup using valid reg token)
        console.log('\n🕵️ Self-looking up Lawyer ID...');
        const profileRes = await axios.get(`${API_URL}/lawyer-profile/my-profile`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        const lawyerId = profileRes.data.lawyerId;
        console.log(`✅ Lawyer ID found: ${lawyerId}`);

        // 3. ADMIN LOGIN
        console.log('\n🔐 Logging in as Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, adminCreds);
        const adminToken = adminLogin.data.token;
        console.log(`✅ Admin logged in.`);

        // 4. VERIFY LAWYER
        console.log(`\n✅ Verifying Lawyer ID: ${lawyerId}...`);
        await axios.put(`${API_URL}/admin/lawyers/${lawyerId}/verify`,
            { isVerified: true },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        console.log(`\n🎉 SUCCESS! Lawyer Verified.`);
        console.log(`EMAIL: ${newLawyer.email}`);
        console.log(`PASSWORD: ${newLawyer.password}`);
        console.log(`LAWYER_ID: ${lawyerId}`);

    } catch (error: any) {
        console.error('❌ Setup Failed:', error.response?.data || error.message);
    }
}

setupVerifiedLawyer();
