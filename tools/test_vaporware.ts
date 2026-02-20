import { PrismaClient } from '@prisma/client';
import { checkLawyerInactivity } from '../backend/src/services/schedulerService';
import { reportUserFraud } from '../backend/src/controllers/reportController';

const prisma = new PrismaClient();

async function testVaporwareFeatures() {
    console.log('🧪 Starting "Vaporware Be Gone" Verification...');

    // 1. SETUP: Create Test Data
    const lawyerId = 'test-lawyer-strike-' + Date.now();
    const userId = 'test-worker-fraud-' + Date.now();

    // Create Lawyer
    const lawyerUser = await prisma.user.create({
        data: {
            email: `lawyer.${Date.now()}@test.com`,
            passwordHash: 'test',
            role: 'lawyer',
            fullName: 'Abogado Dormilon'
        }
    });

    const lawyer = await prisma.lawyer.create({
        data: {
            userId: lawyerUser.id,
            licenseNumber: `LP-${Date.now()}`,
            strikes: 0,
            status: 'ACTIVE',
            profile: {
                create: {
                    yearsOfExperience: 5
                }
            }
        },
        include: { profile: true }
    });

    // Create Worker
    const worker = await prisma.user.create({
        data: {
            email: `worker.${Date.now()}@test.com`,
            passwordHash: 'test',
            role: 'worker',
            fullName: 'Trabajador Paciente',
            isBlocked: false
        }
    });

    // Create "Abandoned" Request (Last activity > 24h ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 2); // 48h ago

    const request = await prisma.contactRequest.create({
        data: {
            workerId: worker.id,
            lawyerProfileId: lawyer.profile!.id,
            caseSummary: 'Caso abandonado de prueba',
            status: 'accepted',
            subStatus: 'chat_active',
            lastLawyerActivityAt: oldDate,
            classification: 'normal'
        }
    });

    console.log(`📝 Created Test Request: ${request.id} assigned to ${lawyer.id}`);

    // 2. TEST AUTO-REASSIGNMENT
    console.log('\n⏳ Running Inactivity Check (Scheduler)...');
    await checkLawyerInactivity();

    const updatedRequest = await prisma.contactRequest.findUnique({ where: { id: request.id } });
    const updatedLawyer = await prisma.lawyer.findUnique({ where: { id: lawyer.id } });

    if (updatedRequest?.status === 'pending' && updatedRequest.lawyerProfileId === null) {
        console.log('✅ PASS: Case was auto-reassigned (returned to pool).');
    } else {
        console.error('❌ FAIL: Case was NOT reassigned.');
    }

    if (updatedLawyer?.strikes === 1) {
        console.log('✅ PASS: Lawyer received a Strike.');
    } else {
        console.error('❌ FAIL: Lawyer did NOT receive a Strike.');
    }

    // 3. TEST FRAUD BLOCK
    console.log('\n🚫 Testing Fraud Enforcement...');

    // Create new request for fraud test
    const fraudRequest = await prisma.contactRequest.create({
        data: {
            workerId: worker.id,
            lawyerProfileId: lawyer.profile!.id,
            caseSummary: 'Caso fraudulento',
            status: 'pending',
            classification: 'normal'
        }
    });

    // Mock Request Object for Controller
    const req = {
        params: { requestId: fraudRequest.id },
        body: { reason: 'Datos falsos detectados' },
        user: { id: lawyerUser.id, role: 'lawyer' }
    } as any;

    const res = {
        status: (code: number) => ({ json: (data: any) => console.log(`Response ${code}:`, data) }),
        json: (data: any) => console.log('Response 200:', data)
    } as any;

    await reportUserFraud(req, res);

    const blockedUser = await prisma.user.findUnique({ where: { id: worker.id } });
    if (blockedUser?.isBlocked) {
        console.log('✅ PASS: User was permanently BLOCKED.');
    } else {
        console.error('❌ FAIL: User was NOT blocked.');
    }

    console.log('\n🎉 Verification Complete.');
}

testVaporwareFeatures()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
