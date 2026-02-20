
import axios from 'axios';

const API_URL = 'http://142.93.186.75:3001';

const adminCreds = { email: 'admin@test.com', password: '123456' };
const lawyerEmail = 'lawyer_pro@test.com';

async function verifyLawyer() {
    console.log('🚀 Starting Lawyer Verification Script...');

    try {
        // 1. ADMIN LOGIN
        console.log('\n🔐 Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, adminCreds);
        const token = loginRes.data.token;
        console.log(`✅ Admin logged in: ${loginRes.data.user.email}`);

        // 2. GET LAWYERS
        console.log('\n🔎 Fetching lawyers...');
        const lawyersRes = await axios.get(`${API_URL}/admin/lawyers`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const lawyers = lawyersRes.data;
        const targetLawyer = lawyers.find((l: any) => l.email === lawyerEmail);

        if (!targetLawyer) {
            console.error(`❌ Lawyer ${lawyerEmail} not found in the list.`);
            return;
        }

        console.log(`✅ Found Lawyer: ${targetLawyer.fullName} (ID: ${targetLawyer.id}) - Verified: ${targetLawyer.isVerified}`);

        if (targetLawyer.isVerified) {
            console.log('✨ Lawyer is already verified.');
            return;
        }

        // 3. VERIFY LAWYER
        console.log('\n✅ Verifying lawyer...');
        await axios.put(`${API_URL}/admin/lawyers/${targetLawyer.id}/verify`,
            { isVerified: true },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('🎉 Lawyer verified successfully!');

    } catch (error: any) {
        console.error('❌ Verification Failed:', error.response?.data || error.message);
    }
}

verifyLawyer();
