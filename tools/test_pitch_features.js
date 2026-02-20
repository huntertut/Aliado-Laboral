const axios = require('axios');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');

const API_URL = 'http://localhost:3001';
const prisma = new PrismaClient();

async function runTest() {
    console.log('🚀 TESTING PITCH FEATURES (VERIFICATION & DOCS)');

    // 1. Setup Test User (Worker)
    const email = `test_pitch_${Date.now()}@worker.com`;
    const password = 'password123';
    console.log(`\n1. Registering Worker: ${email}`);

    try {
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email, password, fullName: 'Juan Pérez Pitch', role: 'worker'
        });
        const token = regRes.data.token;
        const userId = regRes.data.user.id;
        console.log(' -> Registered. ID:', userId);

        // 2. Test Phone Verification
        console.log('\n2. Testing Phone Verification...');
        await axios.post(`${API_URL}/auth/send-verification`, { phoneNumber: '5512345678' }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch code from DB (Mock SMS)
        const userWithCode = await prisma.user.findUnique({ where: { id: userId } });
        const code = userWithCode?.phoneVerificationCode;
        console.log(` -> Code found in DB: ${code}`);

        const verifyRes = await axios.post(`${API_URL}/auth/verify-phone`, { code }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(' -> Verification Result:', verifyRes.data);

        // 3. Setup Test Lawyer (to access docs)
        console.log('\n3. Setting up Lawyer for Doc Access...');
        const lawyerEmail = `lawyer_pitch_${Date.now()}@lawyer.com`;
        const lawyerReg = await axios.post(`${API_URL}/auth/register`, {
            email: lawyerEmail, password, fullName: 'Lic. Pitch', role: 'lawyer', licenseNumber: `LP${Date.now()}`
        });
        const lawyerToken = lawyerReg.data.token;
        const lawyerId = lawyerReg.data.user.id;

        // Verify Lawyer manualy (so he can access docs if needed, though middleware only checks role)
        await prisma.lawyer.update({
            where: { userId: lawyerId },
            data: { isVerified: true }
        });

        // 4. Create Contact Request
        console.log('\n4. Creating Dummy Contact Request...');
        const lawyerProfile = await prisma.lawyerProfile.findFirst({ where: { lawyer: { userId: lawyerId } } });

        const request = await prisma.contactRequest.create({
            data: {
                workerId: userId,
                lawyerProfileId: lawyerProfile.id,
                caseSummary: 'Despido injustificado con 10 años de antigüedad.',
                caseType: 'Despido',
                urgency: 'high',
                estimatedSeverance: 125000,
                employerName: 'Empresa Malvada S.A. de C.V.',
                status: 'accepted'
            }
        });
        console.log(' -> Request Created:', request.id);

        // 5. Generate Document (PDF)
        console.log('\n5. Generating Case File (Carta Poder PDF)...');
        const docRes = await axios.get(`${API_URL}/documents/case-file/${request.id}`, {
            headers: { Authorization: `Bearer ${lawyerToken}` },
            responseType: 'arraybuffer' // Important for PDF
        });

        const fs = require('fs');
        const pdfPath = 'test_expediente.pdf';
        fs.writeFileSync(pdfPath, docRes.data);

        console.log(`✅ SUCCESS: PDF saved to ${pdfPath} (${docRes.data.length} bytes)`);


    } catch (error) {
        console.error('❌ ERROR:', error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
