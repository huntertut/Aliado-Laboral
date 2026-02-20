
import axios from 'axios';

const API_URL = 'http://142.93.186.75:3001';

const workers = [
    { email: 'worker_free@test.com', password: '123456', expectedPlan: '' },
    { email: 'worker_premium@test.com', password: '123456', expectedPlan: 'premium' },
    { email: 'lawyer_pro@test.com', password: '123456', expectedPlan: 'pro' }
];

async function verifyPlans() {
    console.log('🚀 Checking Backend Subscription Plans...');

    for (const u of workers) {
        try {
            console.log(`\n🔍 Checking: ${u.email}...`);
            const login = await axios.post(`${API_URL}/auth/login`, { email: u.email, password: u.password });
            const token = login.data.token;

            let user;
            if (u.email.includes('worker')) {
                // Workers use GET /worker-profile/my-profile
                const res = await axios.get(`${API_URL}/worker-profile/my-profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                user = res.data.user; // Profile endpoint usually returns { ..., user: { ... } } or flattened
                // If profile endpoint returns flattened data without user object, adjust. 
                // Based on backend patterns, usually returns the profile linked to user.
                // Let's fallback to a simpler "Check Me" if exists, or assume standard structure.
                // Actually, let's use the login response data if available, but login response in this system usually just gives token.
                // Let's try to get the user from the profile response.
                if (!user && res.data.userId) user = { role: 'worker', ...res.data };
            } else {
                // Lawyers use GET /lawyer-profile/my-profile
                const res = await axios.get(`${API_URL}/lawyer-profile/my-profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                user = { role: 'lawyer', ...res.data };
            }

            console.log(`✅ Backend Data: Role=${user.role}, Plan=${user.plan || 'NONE'}, SubLevel=${user.subscriptionLevel || 'N/A'}`);

            // Note: AuthContext might unnecessary override this locally, but backend should at least know something.
        } catch (e: any) {
            console.error(`❌ Failed: ${u.email} - ${e.response?.data?.error || e.message}`);
        }
    }
}

verifyPlans();
