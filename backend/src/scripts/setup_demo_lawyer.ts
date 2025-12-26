import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setup() {
    const email = 'lawyer_basic@test.com';

    console.log(`Setting up demo lawyer: ${email}`);

    // 1. Find User
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error('User not found. Please register lawyer_basic@test.com first.');
        return;
    }

    // 2. Ensure Lawyer record
    let lawyer = await prisma.lawyer.findUnique({
        where: { userId: user.id }
    });

    if (!lawyer) {
        lawyer = await prisma.lawyer.create({
            data: {
                userId: user.id,
                licenseNumber: 'L-777888-DEMO',
                specialty: 'Laboral / Civil',
                isVerified: true,
                nationalScope: true,
                availableStates: 'CDMX,EDOMEX,Puebla',
                acceptsFederalCases: true,
                acceptsLocalCases: true
            }
        });
    } else {
        lawyer = await prisma.lawyer.update({
            where: { id: lawyer.id },
            data: {
                isVerified: true,
                licenseNumber: 'L-777888-DEMO',
                specialty: 'Derecho Laboral Individual'
            }
        });
    }

    // 3. Upsert Subscription (BASIC ACTIVE)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2); // 2 months from now

    await prisma.lawyerSubscription.upsert({
        where: { lawyerId: lawyer.id },
        update: {
            plan: 'basic',
            status: 'active',
            amount: 99.00,
            endDate
        },
        create: {
            lawyerId: lawyer.id,
            plan: 'basic',
            status: 'active',
            amount: 99.00,
            startDate: new Date(),
            endDate
        }
    });

    // 4. Update Profile with rich data
    const profile = await prisma.lawyerProfile.upsert({
        where: { lawyerId: lawyer.id },
        update: {
            yearsOfExperience: 10,
            bio: 'Abogado especialista en derecho laboral con más de 10 años de trayectoria. Experticia en despidos injustificados, rescisiones laborales y negociaciones colectivas. Enfocado en obtener la máxima indemnización para mis clientes.',
            wonCase1Summary: 'Indemnización histórica para 50 trabajadores despedidos masivamente.',
            wonCase2Summary: 'Reinstalación de directivo tras 6 meses de litigio por discriminación.',
            wonCase3Summary: 'Liquidación al 100% mas salarios caídos para madre soltera.',
            successRate: 98,
            profileViews: 452,
            totalCases: 120,
            successfulCases: 118,
            phone: '55 1234 5678',
            whatsapp: '55 1234 5678',
            attentionHours: 'Lun a Vie 9:00 AM - 7:00 PM'
        },
        create: {
            lawyerId: lawyer.id,
            yearsOfExperience: 10,
            bio: 'Abogado especialista en derecho laboral con más de 10 años de trayectoria.',
            successRate: 98,
            profileViews: 452,
            totalCases: 120,
            successfulCases: 118,
            phone: '55 1234 5678',
            whatsapp: '55 1234 5678'
        }
    });

    // 5. Clean up old demo requests to avoid cluttering
    await prisma.contactRequest.deleteMany({
        where: { lawyerProfileId: profile.id }
    });

    // 6. Create Case Scenarios

    // Case 1: PENDING (New Request)
    await prisma.contactRequest.create({
        data: {
            workerId: '27ae1c66-0904-4199-97be-c147f34bd19f', // worker_premium@test.com
            lawyerProfileId: profile.id,
            status: 'pending',
            caseSummary: 'Despido injustificado: Me despidieron ayer sin darme carta de rescisión. Llevaba 6 años en la empresa como Almacenista.',
            caseType: 'despido',
            urgency: 'high',
            isHot: true,
            classification: 'hot'
        }
    });

    // Case 2: ACCEPTED (Active Case)
    await prisma.contactRequest.create({
        data: {
            workerId: 'e338ae8a-7af1-47f3-9b2f-a0045fc2c202', // worker_free@test.com
            lawyerProfileId: profile.id,
            status: 'accepted',
            acceptedAt: new Date(Date.now() - 86400000), // Yesterday
            caseSummary: 'Falta de pago de aguinaldo y PTU: La empresa no me ha pagado mis prestaciones de ley correspondientes al año pasado. Trabajo como Cajera.',
            caseType: 'prestaciones',
            urgency: 'normal',
            workerPaid: true,
            lawyerPaid: true
        }
    });

    // Case 3: REJECTED (History)
    await prisma.contactRequest.create({
        data: {
            workerId: 'e338ae8a-7af1-47f3-9b2f-a0045fc2c202',
            lawyerProfileId: profile.id,
            status: 'rejected',
            caseSummary: 'Caso de Pensiones: Busco ayuda para mi jubilación.',
            caseType: 'otro',
            urgency: 'low'
        }
    });

    console.log('✅ Demo Lawyer Setup Complete.');
}

setup()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
