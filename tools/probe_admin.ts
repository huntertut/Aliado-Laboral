
import axios from 'axios';

const API_URL = 'http://142.93.186.75:3001';
const adminCreds = { email: 'admin@test.com', password: '123456' };

async function probeAdmin() {
    console.log('🚀 Probing Admin API...');

    try {
        // 1. LOGIN
        const loginRes = await axios.post(`${API_URL}/auth/login`, adminCreds);
        const token = loginRes.data.token;
        console.log('✅ Admin Logged In');

        // 2. DASHBOARD
        try {
            console.log('📊 Fetching Dashboard...');
            const dash = await axios.get(`${API_URL}/admin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Dashboard OK. Income:', dash.data.kpis.totalIncome);
        } catch (e: any) {
            console.error('❌ Dashboard Failed:', e.response?.status, e.response?.data);
        }

        // 3. DUMMY VERIFY
        try {
            console.log('🧪 Sending Dummy Verify (Expect 500/404)...');
            await axios.put(`${API_URL}/admin/lawyers/00000000-0000-0000-0000-000000000000/verify`,
                { isVerified: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('❓ Dummy Verify Succeeded (Unexpected)');
        } catch (e: any) {
            console.log('ℹ️ Dummy Verify Result:', e.response?.status, e.response?.data);
        }

    } catch (e: any) {
        console.error('❌ Login Failed:', e.message);
    }
}

probeAdmin();
