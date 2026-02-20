
import axios from 'axios';

const API_URL = 'http://142.93.186.75:3001';
const adminCreds = { email: 'admin@test.com', password: '123456' };
const lawyerEmail = 'lawyer_pro@test.com'; // or the one you verified

async function forceVisibility() {
    console.log('🚀 Forcing Lawyer Visibility...');

    try {
        // 1. ADMIN LOGIN
        const loginRes = await axios.post(`${API_URL}/auth/login`, adminCreds);
        const token = loginRes.data.token;
        console.log('✅ Admin Logged In');

        // 2. GET LAWYER ID
        const lawyersRes = await axios.get(`${API_URL}/admin/lawyers`, { headers: { Authorization: `Bearer ${token}` } });
        const targetLawyer = lawyersRes.data.find((l: any) => l.email === lawyerEmail);

        if (!targetLawyer) {
            console.error('❌ Lawyer not found in admin list');
            return;
        }
        console.log(`✅ Found Lawyer ID: ${targetLawyer.id}`);

        // 3. ACTIVATE SUBSCRIPTION (UPDATE DB DIRECTLY IF NO ENDPOINT?)
        // AdminController has updateUserSubscription
        console.log('🔄 Activating Subscription...');
        await axios.put(`${API_URL}/admin/users/${targetLawyer.userId}/subscription`, {
            type: 'lawyer',
            plan: 'pro',
            status: 'active', // CRITICAL
            expirationDays: 30
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log('✅ Subscription Active');

        // 4. ADD FAKE WON CASES & PROFILE DATA (We need to login as lawyer to update profile or use raw SQL/Admin if possible)
        // Admin doesn't seem to have "Update Lawyer Profile" endpoint.
        // We will try to login as lawyer and update own profile.

        console.log('\n👨‍⚖️ Logging in as Lawyer to update profile...');
        const lawyerLogin = await axios.post(`${API_URL}/auth/login`, { email: lawyerEmail, password: '123456' });
        const lawyerToken = lawyerLogin.data.token;

        await axios.put(`${API_URL}/lawyer-profile/my-profile`, {
            specialty: 'Laboral',
            wonCase1Summary: 'Caso Despido Injustificado - 2024 (Ganado)',
            wonCase2Summary: 'Caso Acoso Laboral - 2023 (Conciliado)',
            yearsOfExperience: 5,
            bio: 'Abogado experto en defensa del trabajador.'
        }, { headers: { Authorization: `Bearer ${lawyerToken}` } });

        console.log('✅ Profile Updated with Won Cases');
        console.log('🎉 Lawyer should now be visible in public list!');

    } catch (e: any) {
        console.error('❌ Error:', e.response?.data || e.message);
    }
}

forceVisibility();
