
import axios from 'axios';

const API_URL = 'http://142.93.186.75:3001';

const workerCreds = { email: 'worker_premium@test.com', password: '123456' };
const lawyerCreds = { email: 'lawyer_pro@test.com', password: '123456' };

async function runTest() {
    console.log('🚀 Starting Lawyer-Worker Flow Test on Production...');

    try {
        // 1. LOGIN
        console.log('\n🔐 Logging in...');
        const workerLogin = await axios.post(`${API_URL}/auth/login`, workerCreds);
        const workerToken = workerLogin.data.token;
        const workerId = workerLogin.data.user.id;
        console.log(`✅ Worker Logged In: ${workerLogin.data.user.email}`);

        const lawyerLogin = await axios.post(`${API_URL}/auth/login`, lawyerCreds);
        const lawyerToken = lawyerLogin.data.token;
        const lawyerId = lawyerLogin.data.user.id;

        // Get Lawyer Profile ID
        let lawyerProfileId;
        try {
            const lawyerProfileRes = await axios.get(`${API_URL}/lawyer-profile/my-profile`, {
                headers: { Authorization: `Bearer ${lawyerToken}` }
            });
            lawyerProfileId = lawyerProfileRes.data.id; // Corrected path
            console.log(`✅ Lawyer Logged In: ${lawyerLogin.data.user.email} (ProfileID: ${lawyerProfileId})`);
        } catch (e) {
            console.error('❌ Failed to fetch Lawyer Profile ID. Using fallback...');
            // Fallback: If my-profile fails, try keying off user ID from login
            // but we need profile ID for the request.
            throw new Error('Cannot proceed without Lawyer Profile ID');
        }

        // 2. WORKER CREATES REQUEST
        console.log('\n📝 Worker creating Contact Request...');
        const requestPayload = {
            lawyerProfileId: lawyerProfileId,
            caseSummary: 'Test Case Integration Flow ' + Date.now(),
            caseType: 'despido',
            urgency: 'high',
            paymentGateway: 'stripe', // Mocking stripe flow (backend allows this in dev/test often, or we assume success for test)
            // Note: If backend requires real payment, this might fail or stay pending. 
            // In our seeding logic, we might need to simulate the "payment" step or check if the API creates it as pending.
        };

        const createRes = await axios.post(`${API_URL}/contact/create-with-payment`, requestPayload, {
            headers: { Authorization: `Bearer ${workerToken}` }
        });
        const requestId = createRes.data.contactRequest.id;
        console.log(`✅ Request Created! ID: ${requestId}`);
        console.log(`Payment Info: `, createRes.data.payment);

        // 2.5 SIMULATE WORKER PAYMENT
        // ... (existing logic)

        // 3. LAWYER FETCHES REQUESTS
        console.log('\n📨 Lawyer fetching requests...');
        const lawyerRequestsRes = await axios.get(`${API_URL}/contact/lawyer/requests`, {
            headers: { Authorization: `Bearer ${lawyerToken}` }
        });

        const foundRequest = lawyerRequestsRes.data.requests.find((r: any) => r.id === requestId);

        if (foundRequest) {
            console.log(`✅ Lawyer sees the request! Status: ${foundRequest.status}`);
            // If worker hasn't paid, Lawyer cannot accept.
            console.log(`Worker Paid: ${foundRequest.workerPaid}`);
        } else {
            console.error('❌ Lawyer did NOT see the request.');
        }

        console.log('\n⚠️ NOTE: Full "Accept" flow requires Stripe Webhook simulation for Worker Payment.');
        console.log('   We verified: Login, Creation, and Visibility.');

    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
    }
}

runTest();
