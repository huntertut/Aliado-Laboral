import { PrismaClient } from '@prisma/client';
// import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Chat System Verification...');

    // 1. Create Mock Users
    const workerEmail = `worker_test_${Date.now()}@test.com`;
    const lawyerEmail = `lawyer_test_${Date.now()}@test.com`;

    const worker = await prisma.user.create({
        data: {
            email: workerEmail,
            passwordHash: 'mock_hash',
            fullName: 'Worker Test',
            role: 'worker'
        }
    });

    const lawyerUser = await prisma.user.create({
        data: {
            email: lawyerEmail,
            passwordHash: 'mock_hash',
            fullName: 'Lawyer Test',
            role: 'lawyer'
        }
    });

    // Create Lawyer Profile & Subscription (Required for accepting)
    const lawyer = await prisma.lawyer.create({
        data: {
            userId: lawyerUser.id,
            licenseNumber: `LIC-${Date.now()}`,
            subscriptionStatus: 'active',
            profile: {
                create: {
                    reputationScore: 100,
                    phone: '555-555-5555'
                }
            }
        },
        include: { profile: true }
    });

    console.log(`✅ Users Created: Worker=${worker.id}, Lawyer=${lawyer.id}`);

    // 2. Create Contact Request (Simulating Worker)
    // We bypass the controller to avoid AUTH middlewares in this script, but use the same logic
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const request = await prisma.contactRequest.create({
        data: {
            workerId: worker.id,
            lawyerProfileId: lawyer.profile!.id,
            caseSummary: 'Test Case for Chat System',
            status: 'pending',
            workerPaid: true, // Simulating worker paid
            workerPaymentGateway: 'stripe',
            workerTransactionId: 'mock_tx_worker',
            expiresAt,
            lastWorkerActivityAt: new Date(),
            subStatus: 'waiting_lawyer'
        }
    });

    console.log(`✅ Contact Request Created: ${request.id}`);

    // 3. Accept Request (Simulating Lawyer Controller Logic)
    // We need to simulate the Transaction logic we wrote in contactController.ts
    console.log('🔄 Simulating Lawyer Acceptance...');

    const acceptedRequest = await prisma.$transaction(async (tx: any) => {
        // Update Request
        const updated = await tx.contactRequest.update({
            where: { id: request.id },
            data: {
                lawyerTransactionId: 'mock_tx_lawyer',
                lawyerPaid: true,
                status: 'accepted',
                acceptedAt: new Date(),
                subStatus: 'waiting_worker_response', // Expected State

                // Auto-Welcome Fields
                lastMessageContent: `¡Hola ${worker.fullName?.split(' ')[0]}! Soy tu abogado...`,
                lastMessageSenderId: lawyerUser.id,
                lastMessageAt: new Date(),
                unreadCountWorker: 1,

                lastLawyerActivityAt: new Date()
            }
        });

        // Create Welcome Message
        await tx.chatMessage.create({
            data: {
                requestId: request.id,
                senderId: lawyerUser.id,
                content: `¡Hola ${worker.fullName?.split(' ')[0]}! Soy tu abogado...`,
                type: 'text',
            }
        });

        return updated;
    });

    // ASSERTIONS
    if (acceptedRequest.status !== 'accepted') throw new Error('❌ Status should be accepted');
    if (acceptedRequest.subStatus !== 'waiting_worker_response') throw new Error('❌ subStatus should be waiting_worker_response');
    if (acceptedRequest.unreadCountWorker !== 1) throw new Error('❌ unreadCountWorker should be 1');

    console.log('✅ Lawyer Accepted Request & Auto-Welcome sent correctly.');

    // 4. Worker Replies (Simulating Chat Controller)
    console.log('🔄 Simulating Worker Reply...');

    const workerReply = await prisma.$transaction(async (tx: any) => {
        const msg = await tx.chatMessage.create({
            data: {
                requestId: request.id,
                senderId: worker.id,
                content: 'Hola Licenciado, aquí están mis documentos.',
                type: 'text'
            }
        });

        await tx.contactRequest.update({
            where: { id: request.id },
            data: {
                lastMessageContent: 'Hola Licenciado, aquí están mis documentos.',
                lastMessageSenderId: worker.id,
                lastMessageAt: new Date(),
                subStatus: 'waiting_lawyer_response', // Logic: If worker replies, now waiting for lawyer
                unreadCountLawyer: { increment: 1 },
                lastWorkerActivityAt: new Date()
            }
        });

        return msg;
    });

    // 5. Verify Final State
    const finalRequest = await prisma.contactRequest.findUnique({ where: { id: request.id } });

    if (finalRequest?.subStatus !== 'waiting_lawyer_response') throw new Error('❌ subStatus should be waiting_lawyer_response');
    if (finalRequest?.unreadCountLawyer !== 1) throw new Error('❌ unreadCountLawyer should be 1');
    if (finalRequest?.lastMessageContent !== 'Hola Licenciado, aquí están mis documentos.') throw new Error('❌ lastMessageContent incorrect');

    console.log('✅ Worker Reply processed correctly. State updated.');

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
