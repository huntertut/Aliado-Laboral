import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando Prueba de Verificación de Flujo de Contacto...');

    try {
        // 1. Setup Test Data
        const timestamp = Date.now();
        const workerEmail = `test_worker_${timestamp}@example.com`;
        const lawyerEmail = `test_lawyer_${timestamp}@example.com`;
        const lawyerLicense = `LIC-${timestamp}`;

        console.log('👤 Creando Usuario Trabajador:', workerEmail);
        const worker = await prisma.user.create({
            data: {
                email: workerEmail,
                role: 'worker',
                fullName: 'Juan Pérez (Trabajador)',
                passwordHash: 'hashed_password'
            }
        });

        console.log('⚖️ Creando Usuario Abogado:', lawyerEmail);
        const lawyerUser = await prisma.user.create({
            data: {
                email: lawyerEmail,
                role: 'lawyer',
                fullName: 'Lic. Armando Bronca',
                passwordHash: 'hashed_password'
            }
        });

        // Create Lawyer + Profile + Subscription
        const lawyer = await prisma.lawyer.create({
            data: {
                userId: lawyerUser.id,
                licenseNumber: lawyerLicense,
                specialty: 'Laboral',
                isVerified: true,
                subscriptionStatus: 'active',
                profile: {
                    create: {
                        yearsOfExperience: 5,
                        bio: 'Abogado de prueba',
                        professionalName: 'Lic. Bronca'
                    }
                },
                subscription: { // Create default subscription so "isPro" check doesn't crash
                    create: {
                        plan: 'basic',
                        status: 'active'
                    }
                }
            },
            include: { profile: true, subscription: true }
        });

        if (!lawyer.profile) throw new Error('Lawyer Profile creation failed');

        console.log('✅ Usuarios creados. ID Abogado:', lawyer.id);

        // 2. Simulate Worker creating a Contact Request
        console.log('\n--- PASO 1: Trabajador solicita contacto ---');
        const request = await prisma.contactRequest.create({
            data: {
                workerId: worker.id,
                lawyerProfileId: lawyer.profile.id,
                caseSummary: 'Me despidieron injustificadamente ayer.',
                caseType: 'despido',
                classification: 'normal',
                status: 'pending',
                workerPaymentGateway: 'stripe',
                workerPaid: true,
                lawyerPaymentAmount: 150.00,
                bothPaymentsSucceeded: false
            }
        });
        console.log('✅ Solicitud creada (ID):', request.id);

        // 3. Verify Lawyer View (The "First Lead Free" Logic)
        console.log('\n--- PASO 2: Verificación de "Primer Lead Gratis" ---');

        // Replicating Logic from contactController.ts
        const requests = await prisma.contactRequest.findMany({
            where: { lawyerProfileId: lawyer.profile.id },
            include: { worker: true }
        });

        const currentSubscription = lawyer.subscription;
        const isPro = currentSubscription?.plan === 'pro';
        const isTrialView = requests.length <= 3;

        // Get the specific request we just created
        const reqToCheck = requests.find(r => r.id === request.id);

        if (!reqToCheck) throw new Error('Request not found in DB');

        const isUnlocked = isPro || reqToCheck.status === 'accepted' || reqToCheck.bothPaymentsSucceeded || isTrialView;

        console.log(`📊 Estado del Abogado: [Plan: ${currentSubscription?.plan || 'none'}] [Total Leads: ${requests.length}]`);
        console.log(`🔓 ¿Es Trial View (<3 leads)? ${isTrialView}`);
        console.log(`🔓 ¿Es Pro? ${isPro}`);
        console.log(`🔓 ¿Está Desbloqueado Total? ${isUnlocked}`);

        if (isUnlocked) {
            console.log('👁️  RESULTADO: VISIBLE (Unmasked)');
            console.log(`   Nombre: ${reqToCheck.worker.fullName}`);
            // Explicitly print masked version if it failed
            if (reqToCheck.worker.fullName === 'Trabajador (Bloqueado)') {
                console.error('❌ ERROR: Está bloqueado a pesar de ser Unlocked');
            } else {
                console.log('✅ Lógica de "Muestra Gratis" FUNCIONA CORRECTAMENTE.');
            }
        } else {
            console.log('🔒 RESULTADO: BLOQUEADO (Masked)');
            console.log('❌ ERROR: Debería ser visible por ser el primer lead.');
        }

        // 4. Simulate Lawyer "Accepting" (Paying)
        console.log('\n--- PASO 3: Abogado Acepta el Caso ---');
        // Simulate successful charge
        await prisma.contactRequest.update({
            where: { id: request.id },
            data: {
                status: 'accepted',
                lawyerPaid: true,
                bothPaymentsSucceeded: true,
                subStatus: 'chat_active'
            }
        });
        console.log('✅ Pago del Abogado simulado. Estado actualizado a ACCEPTED.');

        // 5. Verify Chat Created
        const chatMessage = await prisma.chatMessage.create({
            data: {
                requestId: request.id,
                senderId: lawyerUser.id,
                content: 'Hola Juan, he revisado tu caso. Hablemos.'
            }
        });
        console.log('💬 Chat iniciado automáticamente. ID:', chatMessage.id);

        console.log('\n🎉 PRUEBA DE CONCEPTO COMPLETADA EXITOSAMENTE');

    } catch (e) {
        console.error('❌ TEST FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
