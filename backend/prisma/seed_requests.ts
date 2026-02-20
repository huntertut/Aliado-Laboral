
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Contact Requests...');

    // 1. Fetch Users
    const workerStd = await prisma.user.findUnique({ where: { email: 'worker_std@test.com' } });
    const workerPro = await prisma.user.findUnique({ where: { email: 'worker_pro@test.com' } });

    // Note: schema User.lawyerProfile is type Lawyer. Lawyer.profile is type LawyerProfile.
    const lawyerPro1 = await prisma.user.findUnique({
        where: { email: 'lawyer_pro1@test.com' },
        include: { lawyerProfile: { include: { profile: true } } }
    });

    const lawyerPro2 = await prisma.user.findUnique({
        where: { email: 'lawyer_pro2@test.com' },
        include: { lawyerProfile: { include: { profile: true } } }
    });


    if (!workerStd || !workerPro || !lawyerPro1?.lawyerProfile?.profile || !lawyerPro2?.lawyerProfile?.profile) {
        console.error('Missing seed users or profiles. Run seed_users.ts first.');
        return;
    }

    // 2. Create Request: Worker Std -> Lawyer 1 (Pending)
    await prisma.contactRequest.create({
        data: {
            workerId: workerStd.id,
            lawyerProfileId: lawyerPro1.lawyerProfile.profile.id,
            caseSummary: 'Tengo dudas sobre mi liquidación, me despidieron ayer injustificadamente.',
            caseType: 'despido',
            urgency: 'high',
            status: 'pending'
        }
    });
    console.log('Created Request: Worker Std -> Lawyer 1 (Pending)');

    // 3. Create Request: Worker Pro -> Lawyer 2 (Accepted)
    await prisma.contactRequest.create({
        data: {
            workerId: workerPro.id,
            lawyerProfileId: lawyerPro2.lawyerProfile.profile.id,
            caseSummary: 'Necesito revisión de contrato de confidencialidad.',
            caseType: 'otro',
            urgency: 'normal',
            status: 'accepted',
            acceptedAt: new Date()
        }
    });
    console.log('Created Request: Worker Pro -> Lawyer 2 (Accepted)');

    console.log('Seeding Requests Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
